"""Phase 1 configuration for synthetic fraud ML prototype."""

from pathlib import Path

RANDOM_SEED = 42

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "generated"
ARTIFACT_DIR = BASE_DIR / "artifacts"

TRAIN_SIZE = 50_000
EVAL_SIZE = 10_000
LIVE_SIZE = 5_000

MODEL_THRESHOLD = 0.35

# Bumped whenever FEATURE_COLUMNS (order, names, or semantics) changes.
# Person 2/3 should treat a mismatch between a model's recorded
# feature_schema_version and this value as a deployment-blocking error.
FEATURE_SCHEMA_VERSION = "1.0"

MODEL_PATHS = {
    "v1": ARTIFACT_DIR / "model_v1.joblib",
    "v2": ARTIFACT_DIR / "model_v2.joblib",
}

METRICS_PATHS = {
    "v1": ARTIFACT_DIR / "metrics_v1.json",
    "v2": ARTIFACT_DIR / "metrics_v2.json",
    "comparison": ARTIFACT_DIR / "phase1_comparison.json",
}

METADATA_PATHS = {
    "v1": ARTIFACT_DIR / "metadata_v1.json",
    "v2": ARTIFACT_DIR / "metadata_v2.json",
}

FEATURE_COLUMNS = [
    "amount",
    "hour",
    "merchant_category",
    "country",
    "is_international",
    "device_age_days",
    "account_age_days",
    "transactions_last_hour",
    "transactions_last_24h",
    "distance_from_home_km",
    "card_present",
    "previous_declines_24h",
    "avg_transaction_amount_30d",
    "amount_vs_customer_average",
    "is_new_merchant",
]

TARGET_COLUMN = "fraud"
