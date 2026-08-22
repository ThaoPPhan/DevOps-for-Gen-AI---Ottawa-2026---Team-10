"""Central registry for loading fraud-model artifacts and their metadata.

This is the integration surface the rest of the platform depends on:

- Person 2 (monitoring) reads metadata via get_metadata()/list_models() for
  classification thresholds, feature schema version, and baseline metrics
  to compare live behavior against.
- Person 3 (canary/rollback) reads metadata before promoting a canary and
  calls verify_artifact_integrity() to confirm the artifact on disk matches
  what was recorded at training time.
- predict.py calls get_model()/get_metadata() rather than touching joblib
  or the filesystem directly.
"""

from __future__ import annotations

import hashlib
import json
import subprocess
from datetime import UTC, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib

from ml.config import METADATA_PATHS, MODEL_PATHS


class ModelNotFoundError(ValueError):
    """Raised when a model version, artifact, or metadata file is missing."""


def _normalize_version(model_version: str) -> str:
    mv = model_version.lower()
    if mv not in MODEL_PATHS:
        raise ModelNotFoundError(
            f"Unknown model_version '{model_version}'. Expected one of {sorted(MODEL_PATHS)}."
        )
    return mv


def compute_artifact_sha256(path: Path) -> str:
    """Stream-hash a file so large artifacts don't need to fit in memory."""
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def current_git_commit() -> str:
    """Best-effort HEAD commit hash; 'unknown' outside a git checkout."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5,
            check=True,
        )
        return result.stdout.strip()
    except Exception:
        return "unknown"


def build_metadata(
    *,
    model_version: str,
    model_type: str,
    feature_schema_version: str,
    classification_threshold: float,
    feature_names: list[str],
    training_dataset: str,
    training_rows: int,
    random_seed: int,
    metrics: dict[str, Any],
) -> dict[str, Any]:
    """Assemble a model's metadata record. Call after the artifact is saved
    to disk (the artifact hash is computed from the saved file)."""
    mv = _normalize_version(model_version)
    artifact_path = MODEL_PATHS[mv]
    if not artifact_path.exists():
        raise ModelNotFoundError(f"Artifact not found at {artifact_path}; train the model first.")

    return {
        "model_version": mv,
        "model_type": model_type,
        "created_at": datetime.now(UTC).isoformat(),
        "training_dataset": training_dataset,
        "training_rows": int(training_rows),
        "feature_schema_version": feature_schema_version,
        "feature_names": list(feature_names),
        "classification_threshold": classification_threshold,
        "random_seed": random_seed,
        "git_commit": current_git_commit(),
        "artifact_sha256": compute_artifact_sha256(artifact_path),
        "metrics": metrics,
    }


def save_metadata(model_version: str, metadata: dict[str, Any]) -> Path:
    mv = _normalize_version(model_version)
    path = METADATA_PATHS[mv]
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    return path


def load_metadata(model_version: str) -> dict[str, Any]:
    mv = _normalize_version(model_version)
    path = METADATA_PATHS[mv]
    if not path.exists():
        raise ModelNotFoundError(f"Metadata not found at {path}; train the model first.")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=None)
def _load_model_cached(model_version: str):
    path = MODEL_PATHS[model_version]
    if not path.exists():
        raise ModelNotFoundError(f"Artifact not found at {path}; train the model first.")
    return joblib.load(path)


def get_model(model_version: str):
    """Return the loaded sklearn pipeline for model_version (in-process cached)."""
    return _load_model_cached(_normalize_version(model_version))


def get_metadata(model_version: str) -> dict[str, Any]:
    return load_metadata(model_version)


def clear_cache() -> None:
    """Drop cached model objects. Call after retraining in the same process
    (e.g. tests) so get_model() picks up the new artifact from disk."""
    _load_model_cached.cache_clear()


def verify_artifact_integrity(model_version: str) -> bool:
    """Recompute the artifact's SHA-256 and compare against the metadata
    recorded at training time. False means the file on disk has changed
    since it was trained (or metadata is stale) -- do not deploy."""
    mv = _normalize_version(model_version)
    metadata = load_metadata(mv)
    actual_hash = compute_artifact_sha256(MODEL_PATHS[mv])
    return actual_hash == metadata.get("artifact_sha256")


def list_models() -> list[dict[str, Any]]:
    """Summaries of every model version that has metadata on disk."""
    summaries = []
    for mv in MODEL_PATHS:
        if METADATA_PATHS[mv].exists():
            meta = load_metadata(mv)
            summaries.append(
                {
                    "model_version": mv,
                    "model_type": meta.get("model_type"),
                    "created_at": meta.get("created_at"),
                    "feature_schema_version": meta.get("feature_schema_version"),
                    "classification_threshold": meta.get("classification_threshold"),
                    "metrics": meta.get("metrics"),
                }
            )
    return summaries
