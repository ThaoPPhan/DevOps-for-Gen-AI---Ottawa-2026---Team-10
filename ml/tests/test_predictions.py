"""Tests for the stable predict_transaction() interface.

Assumes models have already been trained (`python -m ml.src.train`).
"""

from __future__ import annotations

import pytest

from ml.config import MODEL_PATHS
from ml.src.predict import PredictionError, predict_transaction

pytestmark = pytest.mark.skipif(
    not all(p.exists() for p in MODEL_PATHS.values()),
    reason="model artifacts not found; run ml.src.train first",
)

SAMPLE_TRANSACTION = {
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


@pytest.mark.parametrize("model_version", ["v1", "v2"])
def test_prediction_probability_in_unit_interval(model_version: str) -> None:
    result = predict_transaction(model_version, SAMPLE_TRANSACTION)
    assert 0.0 <= result["fraud_probability"] <= 1.0


@pytest.mark.parametrize("model_version", ["v1", "v2"])
def test_prediction_is_binary(model_version: str) -> None:
    result = predict_transaction(model_version, SAMPLE_TRANSACTION)
    assert result["prediction"] in (0, 1)


@pytest.mark.parametrize("model_version", ["v1", "v2"])
def test_output_contains_model_version(model_version: str) -> None:
    result = predict_transaction(model_version, SAMPLE_TRANSACTION)
    assert result["model_version"] == model_version


def test_v1_and_v2_share_output_schema() -> None:
    r1 = predict_transaction("v1", SAMPLE_TRANSACTION)
    r2 = predict_transaction("v2", SAMPLE_TRANSACTION)
    assert set(r1.keys()) == set(r2.keys())


def test_invalid_model_version_raises() -> None:
    with pytest.raises(PredictionError):
        predict_transaction("v99", SAMPLE_TRANSACTION)


def test_missing_field_raises() -> None:
    incomplete = dict(SAMPLE_TRANSACTION)
    del incomplete["amount"]
    with pytest.raises(PredictionError):
        predict_transaction("v1", incomplete)


def test_negative_amount_raises() -> None:
    bad = dict(SAMPLE_TRANSACTION, amount=-100.0)
    with pytest.raises(PredictionError):
        predict_transaction("v1", bad)


def test_out_of_range_hour_raises() -> None:
    bad = dict(SAMPLE_TRANSACTION, hour=25)
    with pytest.raises(PredictionError):
        predict_transaction("v1", bad)
