"""Sanity checks on the generated synthetic datasets.

Assumes `python -m ml.scripts.generate_dataset` has already been run
(these tests read the CSVs from disk rather than regenerating them, to
keep the suite fast).
"""

from __future__ import annotations

import pandas as pd
import pytest

from ml.config import DATA_DIR, FEATURE_COLUMNS, TARGET_COLUMN

SPLITS = ["train", "evaluation", "live"]


@pytest.fixture(scope="module", params=SPLITS)
def dataset(request) -> pd.DataFrame:
    path = DATA_DIR / f"{request.param}.csv"
    if not path.exists():
        pytest.skip(f"{path} not found; run generate_dataset first")
    return pd.read_csv(path)


def test_required_columns_present(dataset: pd.DataFrame) -> None:
    missing = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in dataset.columns]
    assert not missing, f"missing columns: {missing}"


def test_no_negative_amounts(dataset: pd.DataFrame) -> None:
    assert (dataset["amount"] >= 0).all()


def test_fraud_labels_are_binary(dataset: pd.DataFrame) -> None:
    assert set(dataset[TARGET_COLUMN].unique()) <= {0, 1}


def test_fraud_ratio_within_expected_range(dataset: pd.DataFrame) -> None:
    ratio = dataset[TARGET_COLUMN].mean()
    assert 0.01 <= ratio <= 0.15, f"fraud ratio {ratio:.4f} outside plausible imbalanced range"


def test_transaction_ids_unique(dataset: pd.DataFrame) -> None:
    assert dataset["transaction_id"].is_unique


def test_hour_within_range(dataset: pd.DataFrame) -> None:
    assert dataset["hour"].between(0, 23).all()


def test_binary_flags_are_0_or_1(dataset: pd.DataFrame) -> None:
    for col in ("is_international", "card_present", "is_new_merchant"):
        assert set(dataset[col].unique()) <= {0, 1}, col


def test_all_split_files_exist() -> None:
    for split in SPLITS:
        assert (DATA_DIR / f"{split}.csv").exists(), f"missing {split}.csv"
