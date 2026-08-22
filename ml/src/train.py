"""Train V1 and V2 fraud models."""

from __future__ import annotations

import json
from datetime import UTC, datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ml.config import (
    ARTIFACT_DIR,
    FEATURE_COLUMNS,
    FEATURE_SCHEMA_VERSION,
    METRICS_PATHS,
    MODEL_PATHS,
    MODEL_THRESHOLD,
    RANDOM_SEED,
    TARGET_COLUMN,
)
from ml.src import model_registry
from ml.src.evaluate import evaluate_model

MODEL_TYPE = "HistGradientBoostingClassifier"


def _build_pipeline(random_seed: int) -> Pipeline:
    categorical_features = ["merchant_category", "country"]
    numeric_features = [c for c in FEATURE_COLUMNS if c not in categorical_features]

    preprocess = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("num", "passthrough", numeric_features),
        ]
    )

    # HistGradientBoostingClassifier gives much better-calibrated
    # probabilities than a class-weighted RandomForest at this ~4% fraud
    # prevalence, which matters because we operate at a fixed threshold
    # rather than re-tuning per model.
    clf = HistGradientBoostingClassifier(
        max_iter=400,
        learning_rate=0.06,
        max_depth=6,
        l2_regularization=0.1,
        random_state=random_seed,
    )

    return Pipeline(steps=[("preprocess", preprocess), ("model", clf)])


def train_phase1_models() -> dict[str, dict]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    train_df = pd.read_csv("ml/data/generated/train.csv")
    eval_df = pd.read_csv("ml/data/generated/evaluation.csv")

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df[TARGET_COLUMN]

    X_eval = eval_df[FEATURE_COLUMNS]
    y_eval = eval_df[TARGET_COLUMN]

    # Healthy baseline
    v1 = _build_pipeline(RANDOM_SEED)
    v1.fit(X_train, y_train)

    # Controlled regression V2:
    # Legitimate high-value transactions (amount > $300, non-fraud) are
    # heavily underrepresented in V2's training data -- only a small random
    # slice is kept. V2 therefore never learns that a large amount can be
    # normal for an established, in-person, domestic customer, and starts
    # flagging that pattern as suspicious. This is a realistic mistake (e.g.
    # a bad training-data sampling job) rather than a hand-flipped label,
    # and it specifically targets the high-value-legitimate segment the live
    # stream gradually shifts toward (see generate_data.py), so the false
    # positive rate should climb visibly as canary traffic grows.
    rng = np.random.default_rng(RANDOM_SEED + 7)
    high_value_legit = (train_df[TARGET_COLUMN] == 0) & (train_df["amount"] > 300)
    keep_roll = rng.random(len(train_df))
    keep_mask = ~high_value_legit | (keep_roll < 0.003)

    biased_train = train_df[keep_mask].copy()
    X_train_v2 = biased_train[FEATURE_COLUMNS]
    y_train_v2 = biased_train[TARGET_COLUMN]

    v2 = _build_pipeline(RANDOM_SEED + 1)
    v2.fit(X_train_v2, y_train_v2)

    joblib.dump(v1, MODEL_PATHS["v1"])
    joblib.dump(v2, MODEL_PATHS["v2"])
    model_registry.clear_cache()

    raw_metrics_v1 = evaluate_model(v1, X_eval, y_eval, threshold=MODEL_THRESHOLD)
    raw_metrics_v2 = evaluate_model(v2, X_eval, y_eval, threshold=MODEL_THRESHOLD)

    # Legacy flat metrics files, kept for evaluate.py's comparison report.
    metrics_v1 = {
        **raw_metrics_v1,
        "model_version": "v1",
        "trained_at": datetime.now(UTC).isoformat(),
        "train_rows": int(len(train_df)),
    }
    metrics_v2 = {
        **raw_metrics_v2,
        "model_version": "v2",
        "trained_at": datetime.now(UTC).isoformat(),
        "train_rows": int(len(biased_train)),
    }

    with open(METRICS_PATHS["v1"], "w", encoding="utf-8") as f:
        json.dump(metrics_v1, f, indent=2)

    with open(METRICS_PATHS["v2"], "w", encoding="utf-8") as f:
        json.dump(metrics_v2, f, indent=2)

    # Full governance metadata (feature schema, threshold, artifact hash,
    # git commit, dataset identifier) consumed by model_registry.py.
    metadata_v1 = model_registry.build_metadata(
        model_version="v1",
        model_type=MODEL_TYPE,
        feature_schema_version=FEATURE_SCHEMA_VERSION,
        classification_threshold=MODEL_THRESHOLD,
        feature_names=FEATURE_COLUMNS,
        training_dataset="data/generated/train.csv",
        training_rows=len(train_df),
        random_seed=RANDOM_SEED,
        metrics=raw_metrics_v1,
    )
    metadata_v2 = model_registry.build_metadata(
        model_version="v2",
        model_type=MODEL_TYPE,
        feature_schema_version=FEATURE_SCHEMA_VERSION,
        classification_threshold=MODEL_THRESHOLD,
        feature_names=FEATURE_COLUMNS,
        training_dataset="data/generated/train.csv",
        training_rows=len(biased_train),
        random_seed=RANDOM_SEED + 1,
        metrics=raw_metrics_v2,
    )
    model_registry.save_metadata("v1", metadata_v1)
    model_registry.save_metadata("v2", metadata_v2)

    return {"v1": metrics_v1, "v2": metrics_v2}


if __name__ == "__main__":
    results = train_phase1_models()
    for key in ["v1", "v2"]:
        r = results[key]
        print(
            f"{key.upper()} | acc={r['accuracy']:.4f} precision={r['precision']:.4f} "
            f"recall={r['recall']:.4f} fpr={r['false_positive_rate']:.4f}"
        )
