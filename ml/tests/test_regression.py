"""Confirms V2's controlled regression is actually present in saved metrics.

Assumes models have already been trained (`python -m ml.src.train`), which
writes ARTIFACT_DIR/metrics_v1.json and metrics_v2.json.
"""

from __future__ import annotations

import json

import pytest

from ml.config import METRICS_PATHS

pytestmark = pytest.mark.skipif(
    not (METRICS_PATHS["v1"].exists() and METRICS_PATHS["v2"].exists()),
    reason="metrics files not found; run ml.src.train first",
)


def _load(version: str) -> dict:
    with open(METRICS_PATHS[version], "r", encoding="utf-8") as f:
        return json.load(f)


def test_v2_false_positive_rate_worse_than_v1() -> None:
    v1, v2 = _load("v1"), _load("v2")
    assert v2["false_positive_rate"] > v1["false_positive_rate"]


def test_v1_meets_production_floor() -> None:
    v1 = _load("v1")
    assert v1["accuracy"] > 0.90
    assert v1["false_positive_rate"] < 0.05


def test_v2_still_catches_fraud() -> None:
    # The regression should degrade precision on legitimate high-value
    # transactions, not turn V2 into a non-functional model.
    v2 = _load("v2")
    assert v2["recall"] > 0.50
