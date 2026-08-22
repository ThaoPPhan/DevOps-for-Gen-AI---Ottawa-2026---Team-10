"""Typed schemas for the fraud-model prediction and metadata contracts.

This is the stable interface the rest of the platform integrates against.
FEATURE_COLUMNS in config.py is the single source of truth for field
names/order; the dataclasses here exist for typed access and documentation.
Changing a field name, type, or FEATURE_COLUMNS itself is a breaking change
and must bump FEATURE_SCHEMA_VERSION in config.py.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ml.config import FEATURE_COLUMNS


@dataclass(frozen=True)
class TransactionInput:
    amount: float
    hour: int
    merchant_category: str
    country: str
    is_international: int
    device_age_days: int
    account_age_days: int
    transactions_last_hour: int
    transactions_last_24h: int
    distance_from_home_km: float
    card_present: int
    previous_declines_24h: int
    avg_transaction_amount_30d: float
    amount_vs_customer_average: float
    is_new_merchant: int


@dataclass(frozen=True)
class PredictionResult:
    model_version: str
    fraud_probability: float
    prediction: int
    threshold: float
    latency_ms: float


@dataclass(frozen=True)
class ModelMetadata:
    model_version: str
    model_type: str
    created_at: str
    training_dataset: str
    training_rows: int
    feature_schema_version: str
    feature_names: list[str]
    classification_threshold: float
    random_seed: int
    git_commit: str
    artifact_sha256: str
    metrics: dict[str, Any]


class SchemaValidationError(ValueError):
    """Raised when a transaction dict does not satisfy the input schema."""


# Fields that must be present and non-negative numeric values.
_NUMERIC_FIELDS = {
    "amount",
    "hour",
    "device_age_days",
    "account_age_days",
    "transactions_last_hour",
    "transactions_last_24h",
    "distance_from_home_km",
    "previous_declines_24h",
    "avg_transaction_amount_30d",
    "amount_vs_customer_average",
}

# Fields that must be exactly 0 or 1.
_BINARY_FIELDS = {"is_international", "card_present", "is_new_merchant"}


def validate_transaction(transaction: dict) -> None:
    """Validate a transaction dict against the input schema.

    Raises SchemaValidationError with a clear, specific message on the
    first violation found. Does not mutate the input.
    """
    if not isinstance(transaction, dict):
        raise SchemaValidationError(f"transaction must be a dict, got {type(transaction).__name__}")

    missing = [c for c in FEATURE_COLUMNS if c not in transaction]
    if missing:
        raise SchemaValidationError(f"Missing required fields: {missing}")

    for field_name in _NUMERIC_FIELDS:
        value = transaction[field_name]
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            raise SchemaValidationError(
                f"Field '{field_name}' must be numeric, got {type(value).__name__}"
            )
        if value < 0:
            raise SchemaValidationError(f"Field '{field_name}' must be >= 0, got {value}")

    if not (0 <= transaction["hour"] <= 23):
        raise SchemaValidationError(f"Field 'hour' must be in [0, 23], got {transaction['hour']}")

    for field_name in _BINARY_FIELDS:
        value = transaction[field_name]
        if value not in (0, 1):
            raise SchemaValidationError(f"Field '{field_name}' must be 0 or 1, got {value}")

    if not isinstance(transaction["merchant_category"], str) or not transaction["merchant_category"]:
        raise SchemaValidationError("Field 'merchant_category' must be a non-empty string")

    if not isinstance(transaction["country"], str) or not transaction["country"]:
        raise SchemaValidationError("Field 'country' must be a non-empty string")
