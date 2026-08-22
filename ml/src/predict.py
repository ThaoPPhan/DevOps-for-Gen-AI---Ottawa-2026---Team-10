"""Stable prediction interface for V1/V2.

predict_transaction() is the one contract the backend team integrates
against: same input dict shape, same output dict shape, for either model
version. Model loading, caching, and threshold sourcing are delegated to
model_registry.py so this file stays a thin, stable surface.
"""

from __future__ import annotations

from time import perf_counter

import pandas as pd

from ml.config import FEATURE_COLUMNS
from ml.src import model_registry
from ml.src.schemas import SchemaValidationError, validate_transaction


class PredictionError(ValueError):
    """Raised when prediction input or model_version is invalid."""


def predict_transaction(model_version: str, transaction: dict) -> dict:
    try:
        validate_transaction(transaction)
    except SchemaValidationError as exc:
        raise PredictionError(str(exc)) from exc

    try:
        model = model_registry.get_model(model_version)
        metadata = model_registry.get_metadata(model_version)
    except model_registry.ModelNotFoundError as exc:
        raise PredictionError(str(exc)) from exc

    normalized_mv = metadata["model_version"]
    threshold = metadata["classification_threshold"]

    input_df = pd.DataFrame([transaction], columns=FEATURE_COLUMNS)

    start = perf_counter()
    proba = float(model.predict_proba(input_df)[0, 1])
    latency_ms = (perf_counter() - start) * 1000.0

    pred = int(proba >= threshold)

    return {
        "model_version": normalized_mv,
        "fraud_probability": proba,
        "prediction": pred,
        "threshold": threshold,
        "latency_ms": latency_ms,
    }


if __name__ == "__main__":
    sample = {
        "amount": 1800.0,
        "hour": 2,
        "merchant_category": "electronics",
        "country": "US",
        "is_international": 0,
        "device_age_days": 2,
        "account_age_days": 950,
        "transactions_last_hour": 5,
        "transactions_last_24h": 12,
        "distance_from_home_km": 340.0,
        "card_present": 0,
        "previous_declines_24h": 2,
        "avg_transaction_amount_30d": 120.0,
        "amount_vs_customer_average": 15.0,
        "is_new_merchant": 1,
    }

    for mv in ("v1", "v2"):
        try:
            print(mv, predict_transaction(mv, sample))
        except PredictionError as exc:
            print(f"{mv} error: {exc}")
