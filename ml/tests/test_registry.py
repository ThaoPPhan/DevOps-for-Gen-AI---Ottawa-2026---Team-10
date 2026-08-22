"""Tests for model_registry.py: metadata contract and artifact integrity.

Assumes models have already been trained (`python -m ml.src.train`).
"""

from __future__ import annotations

import pytest

from ml.config import FEATURE_SCHEMA_VERSION, MODEL_PATHS
from ml.src import model_registry

pytestmark = pytest.mark.skipif(
    not all(p.exists() for p in MODEL_PATHS.values()),
    reason="model artifacts not found; run ml.src.train first",
)

REQUIRED_METADATA_FIELDS = {
    "model_version",
    "model_type",
    "created_at",
    "training_dataset",
    "training_rows",
    "feature_schema_version",
    "feature_names",
    "classification_threshold",
    "random_seed",
    "git_commit",
    "artifact_sha256",
    "metrics",
}


@pytest.mark.parametrize("model_version", ["v1", "v2"])
def test_metadata_has_required_fields(model_version: str) -> None:
    metadata = model_registry.get_metadata(model_version)
    missing = REQUIRED_METADATA_FIELDS - metadata.keys()
    assert not missing, f"metadata missing fields: {missing}"


@pytest.mark.parametrize("model_version", ["v1", "v2"])
def test_metadata_feature_schema_version_matches_config(model_version: str) -> None:
    metadata = model_registry.get_metadata(model_version)
    assert metadata["feature_schema_version"] == FEATURE_SCHEMA_VERSION


@pytest.mark.parametrize("model_version", ["v1", "v2"])
def test_artifact_integrity_verifies(model_version: str) -> None:
    assert model_registry.verify_artifact_integrity(model_version) is True


@pytest.mark.parametrize("model_version", ["v1", "v2"])
def test_artifact_sha256_is_64_hex_chars(model_version: str) -> None:
    metadata = model_registry.get_metadata(model_version)
    digest = metadata["artifact_sha256"]
    assert len(digest) == 64
    int(digest, 16)  # raises if not valid hex


def test_unknown_model_version_raises() -> None:
    with pytest.raises(model_registry.ModelNotFoundError):
        model_registry.get_model("v99")


def test_list_models_returns_both_versions() -> None:
    summaries = model_registry.list_models()
    versions = {s["model_version"] for s in summaries}
    assert versions == {"v1", "v2"}
