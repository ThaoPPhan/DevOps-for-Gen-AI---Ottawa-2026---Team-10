You are my senior ML engineer and coding partner for a DevOps for GenAI hackathon.

I am Person 1 on a 5-person team. My responsibility is the **ML / Model Engineering layer** for an AI reliability platform that protects a bank fraud-detection system.

The overall hackathon project works like this:

* Model V1 is the current healthy fraud-detection model.
* Model V2 is a candidate model being tested before and during canary deployment.
* V2 should look realistic and reasonably competent, but contain a controlled regression so that our monitoring system can detect degradation.
* Another teammate monitors model health, drift, precision, recall, false-positive rate, latency, and thresholds.
* Another teammate handles canary deployment and rollback with AWS SageMaker + Step Functions.
* Another teammate integrates API Gateway, Lambda, DynamoDB, and backend APIs.
* Another teammate builds the dashboard.
* My deliverables must therefore be clean, reproducible, well-documented, and easy for the rest of the team to integrate.

The hackathon judges care about a working use case, measurable outcomes, production readiness, testing, security, observability, governance, and reproducibility. Our demo should show a candidate model that initially appears deployable, receives a small amount of traffic, degrades on a meaningful metric, and causes the platform to trigger rollback.

## Primary Goal

Build a complete ML subsystem that supports this flow:

```text
Synthetic Transaction Generator
        ↓
Training Dataset
        ↓
    ┌──────────────┐
    │              │
Model V1        Model V2
Healthy         Controlled regression
    │              │
    └──────┬───────┘
           ↓
     Offline Evaluation
           ↓
    Save model artifacts
           ↓
Deploy to SageMaker
           ↓
Transaction
           ↓
Fraud probability + prediction
```

I want you to help me build this incrementally and keep the implementation hackathon-friendly.

---

# 1. Technical Constraints

Use:

* Python 3.11 or 3.12
* pandas
* numpy
* scikit-learn
* joblib
* matplotlib only if visualization is useful
* boto3 / SageMaker SDK only for AWS deployment code
* optionally XGBoost only if there is a clear advantage and dependency setup remains simple

Prefer **scikit-learn RandomForestClassifier or HistGradientBoostingClassifier** for the first working version.

Do NOT introduce unnecessary frameworks such as TensorFlow, PyTorch, Spark, MLflow, Kubernetes, Airflow, or feature stores unless I explicitly ask later.

The project must work locally before AWS is introduced.

Keep the code modular, typed where practical, and easy to understand.

---

# 2. Repository Structure

Create or work toward this structure:

```text
ml/
├── README.md
├── requirements.txt
├── config.py
├── data/
│   ├── generated/
│   │   ├── train.csv
│   │   ├── evaluation.csv
│   │   └── live_stream.csv
│   └── README.md
├── artifacts/
│   ├── model_v1.joblib
│   ├── model_v2.joblib
│   ├── metadata_v1.json
│   └── metadata_v2.json
├── src/
│   ├── __init__.py
│   ├── generate_data.py
│   ├── features.py
│   ├── train.py
│   ├── evaluate.py
│   ├── predict.py
│   ├── model_registry.py
│   └── schemas.py
├── scripts/
│   ├── generate_dataset.py
│   ├── train_models.py
│   ├── evaluate_models.py
│   ├── demo_predictions.py
│   └── deploy_sagemaker.py
└── tests/
    ├── test_data.py
    ├── test_features.py
    └── test_predictions.py
```

Do not create every file blindly if a simpler implementation is enough initially. Start with the minimal working path, then refactor toward this structure.

---

# 3. Synthetic Banking Transaction Dataset

Build a realistic but fully synthetic transaction dataset.

Each transaction should contain fields similar to:

```text
transaction_id
customer_id
amount
hour
merchant_category
country
is_international
device_age_days
account_age_days
transactions_last_hour
transactions_last_24h
distance_from_home_km
card_present
previous_declines_24h
avg_transaction_amount_30d
amount_vs_customer_average
is_new_merchant
fraud
```

Use sensible distributions.

Examples:

* Most transactions should be legitimate.
* Fraud should be imbalanced and represent roughly 2–8% of transactions.
* Transaction amounts should be right-skewed rather than uniformly distributed.
* Most accounts should have reasonable account ages.
* Most devices should not be brand new.
* International transactions should be less frequent than domestic ones.
* Some merchant categories should have slightly higher risk than others.

Create fraud probability from underlying rules instead of assigning labels randomly.

Fraud risk should increase under combinations such as:

* unusually high amount relative to customer history
* very new device
* international transaction
* unusual late-night hours
* several transactions in a short period
* large physical distance from home
* multiple recent declines
* new merchant
* card-not-present behavior

Do NOT make any one feature perfectly predict fraud.

Introduce randomness/noise so the model cannot achieve unrealistic 100% accuracy.

Use a fixed random seed for reproducibility.

---

# 4. Dataset Splits

Generate three datasets:

## train.csv

Used for model training.

Suggested size:

* 30,000–100,000 rows

## evaluation.csv

A fixed holdout dataset.

Suggested size:

* 5,000–20,000 rows

This dataset should be stable and reproducible so both models can be compared fairly.

## live_stream.csv

Used by our demo system as simulated production transactions.

Suggested size:

* 2,000–10,000 rows

Important:

The live stream should contain a deliberately higher concentration of the transaction pattern that exposes the V2 regression.

However, do not make every row pathological. It should still resemble plausible production traffic.

---

# 5. Model V1 — Healthy Production Model

Train Model V1 as the baseline healthy fraud detector.

The model API must conceptually support:

```python
fraud_probability = model.predict_proba(transaction)[0, 1]
fraud_prediction = fraud_probability >= threshold
```

Use a configurable threshold rather than assuming 0.5 is always correct.

Evaluate:

* accuracy
* precision
* recall
* F1
* false-positive rate
* false-negative rate
* ROC-AUC if useful
* confusion matrix counts
* number of samples
* inference latency where practical

Because fraud is imbalanced, explain in comments / documentation why accuracy alone is insufficient.

Target approximately:

```text
Accuracy:            > 94%
Precision:           > 90%
Recall:              > 90%
False Positive Rate: < 4–5%
```

These are demo targets, not hard requirements. If synthetic-data behavior produces slightly different values, tune the generator/model reasonably.

Do NOT manipulate evaluation results manually.

---

# 6. Model V2 — Controlled Regression

This is the most important requirement.

Model V2 should NOT simply be a completely broken or random model.

It should remain plausible enough that someone might consider deploying it.

Create a controlled regression.

Preferred scenario:

### V2 has an increased false-positive rate on legitimate high-value transactions.

Example:

```text
Legitimate transaction:
amount = $2,500
customer has long history
known device
domestic
normal merchant

V1:
fraud_probability = 0.11

V2:
fraud_probability = 0.76
```

This creates a strong banking story:

* V2 still catches fraud.
* Overall accuracy may remain respectable.
* But it starts incorrectly declining legitimate customer purchases.
* False-positive rate rises beyond the production threshold.
* Monitoring detects it.
* Canary deployment is rolled back.

Alternative acceptable scenario:

V2 has worse recall for international fraud.

For example:

```text
V1 recall = 95%
V2 recall = 82%
```

Preferred implementation approaches, in order:

1. Introduce controlled training-data bias.
2. Train V2 using an intentionally shifted/restricted training subset.
3. Alter feature representation in a realistic way.
4. Only if necessary, tune hyperparameters to create weaker performance.

Avoid obviously fake code such as:

```python
if model_version == "v2":
    randomly_flip_20_percent_of_predictions()
```

unless it is strictly part of a separate failure-simulation mode.

The regression should originate from believable ML behavior.

---

# 7. Model Metadata

For each model, save metadata such as:

```json
{
  "model_version": "v1",
  "model_type": "RandomForestClassifier",
  "created_at": "...",
  "training_dataset": "train.csv",
  "feature_schema_version": "1.0",
  "classification_threshold": 0.5,
  "metrics": {
    "accuracy": 0.978,
    "precision": 0.952,
    "recall": 0.961,
    "false_positive_rate": 0.021
  }
}
```

Include:

* model version
* algorithm
* timestamp
* threshold
* training dataset identifier
* feature names
* feature schema version
* evaluation metrics
* random seed
* optional git commit placeholder
* optional model artifact hash

This metadata will later support governance and deployment auditing.

---

# 8. Prediction Contract

Create one stable prediction interface that the backend team can depend on.

Input example:

```json
{
  "amount": 1800.0,
  "hour": 2,
  "merchant_category": "electronics",
  "country": "US",
  "is_international": true,
  "device_age_days": 2,
  "account_age_days": 950,
  "transactions_last_hour": 5,
  "transactions_last_24h": 12,
  "distance_from_home_km": 340.0,
  "card_present": false,
  "previous_declines_24h": 2,
  "avg_transaction_amount_30d": 120.0,
  "amount_vs_customer_average": 15.0,
  "is_new_merchant": true
}
```

Output example:

```json
{
  "model_version": "v1",
  "fraud_probability": 0.9132,
  "prediction": 1,
  "threshold": 0.5,
  "latency_ms": 4.7
}
```

Keep the schema consistent between V1 and V2.

Build:

```python
predict_transaction(model_version: str, transaction: dict) -> dict
```

Validate required fields.

Return clear errors for invalid model version or missing fields.

---

# 9. Evaluation Output

Create an evaluation script that compares V1 and V2 and outputs machine-readable JSON plus readable terminal output.

Example:

```text
MODEL COMPARISON
================================================

Metric                 V1         V2        Change
Accuracy             97.8%      94.4%       -3.4%
Precision            95.2%      88.3%       -6.9%
Recall               96.1%      91.0%       -5.1%
False Positive        2.1%       8.4%       +6.3%
F1                    95.6%      89.6%       -6.0%

Production Policy

Maximum FPR           5.0%

V1: PASS
V2: FAIL

Reason:
V2 false-positive rate exceeds policy threshold.
```

Also save something like:

```text
artifacts/evaluation_report.json
```

Example structure:

```json
{
  "v1": {
    "accuracy": 0.978,
    "precision": 0.952,
    "recall": 0.961,
    "false_positive_rate": 0.021
  },
  "v2": {
    "accuracy": 0.944,
    "precision": 0.883,
    "recall": 0.910,
    "false_positive_rate": 0.084
  },
  "comparison": {
    "false_positive_rate_delta": 0.063
  },
  "policy": {
    "max_false_positive_rate": 0.05
  },
  "decision": "FAIL"
}
```

---

# 10. Production Policy

Implement simple config-driven thresholds.

Example:

```python
POLICY = {
    "min_accuracy": 0.90,
    "min_precision": 0.85,
    "min_recall": 0.85,
    "max_false_positive_rate": 0.05,
}
```

Or use a JSON/YAML config if easy.

Return:

```text
HEALTHY
WARNING
CRITICAL
```

Important:

Do not rely only on a weighted health score.

Critical policy violations should override the score.

For example:

```text
IF false_positive_rate > 5%:
    CRITICAL

IF recall < 85%:
    CRITICAL
```

This logic should be easy for Person 2 to consume or replicate.

---

# 11. Production-Like Label Timing

In the README and architecture notes, explicitly acknowledge:

Real banks do not instantly know whether every transaction is fraudulent.

Therefore distinguish:

### Immediate signals

* model latency
* endpoint failures
* prediction distribution
* fraud-score distribution
* input feature drift
* missing feature rates

### Delayed quality signals

* precision
* recall
* false-positive rate
* false-negative rate
* accuracy

For our synthetic hackathon demo, ground-truth labels are available immediately so the team can demonstrate rollback within minutes.

Make this clear so the demo is realistic rather than pretending production labels are instantaneous.

---

# 12. Failure Simulation Support

Provide at least one controlled way for the demo system to expose degraded behavior.

Prefer using V2's natural controlled regression.

Also optionally support a demo profile such as:

```python
DEMO_SCENARIO = "high_value_legitimate_shift"
```

This should modify the distribution of incoming transactions rather than arbitrarily corrupt model outputs.

For example, the live stream can gradually contain more:

```text
high-value
legitimate
domestic
trusted-device
established-customer
```

transactions.

V1 handles them correctly.

V2 misclassifies too many.

This causes:

```text
FPR:
2.3%
3.0%
4.4%
5.7%
8.1%

→ CRITICAL
```

This will trigger Person 3's rollback logic.

---

# 13. SageMaker Deployment

Do this only after everything works locally.

Create deployment code so V1 and V2 can be hosted separately.

Target architecture:

```text
Model V1 artifact
      ↓
SageMaker Endpoint V1

Model V2 artifact
      ↓
SageMaker Endpoint V2
```

Or, if better for canary traffic:

```text
SageMaker Endpoint

Variant: V1
Variant: V2

Traffic weights controlled by deployment system
```

Because another teammate is responsible for deployment/rollback, do NOT take ownership of their whole Step Functions workflow.

Your responsibility is:

* produce model artifacts compatible with deployment
* provide inference entry point
* define model input/output contract
* help configure SageMaker model packaging
* validate that both versions can respond correctly

If SageMaker deployment becomes too time-consuming, maintain a local/FastAPI inference fallback so the demo is never blocked by AWS.

---

# 14. Tests

Add lightweight tests.

At minimum:

### Dataset tests

* required columns exist
* no impossible negative amounts
* fraud labels are binary
* fraud ratio is within expected range
* train/evaluation/live files are generated

### Prediction tests

* valid transaction returns probability in [0, 1]
* prediction is 0 or 1
* output contains model_version
* both V1 and V2 use same schema

### Regression test

Confirm V2 performs measurably worse on the intended scenario.

Example:

```python
assert v2_false_positive_rate > v1_false_positive_rate
```

But avoid overly brittle exact thresholds that could randomly fail.

---

# 15. Logging

Add useful logs such as:

```text
INFO loaded model v1
INFO prediction completed model=v1 latency_ms=4.2
INFO evaluation completed model=v2 fpr=0.083
WARNING model v2 exceeds FPR threshold
```

Never log secrets.

Do not log sensitive customer-like identifiers unnecessarily.

Since this is synthetic data, still demonstrate good production hygiene.

---

# 16. README

Create a concise but strong ML README explaining:

1. What the ML subsystem does
2. Synthetic dataset design
3. Features
4. How fraud labels are generated
5. Why class imbalance matters
6. V1 behavior
7. V2 controlled regression
8. Evaluation metrics
9. How to reproduce results
10. Prediction schema
11. SageMaker deployment path
12. Limitations

Explicitly state:

> The objective is not to build a state-of-the-art fraud detection algorithm. The fraud models act as a realistic high-stakes ML workload for demonstrating safe model evaluation, monitoring, canary release, and automatic rollback.

---

# 17. Development Workflow

Work incrementally.

Do NOT dump the entire project at once.

Use the following phases.

## Phase 1 — Minimal local prototype

Build:

```text
generate_data.py
train.py
evaluate.py
predict.py
```

Then run them and verify actual metrics.

Before moving on, show me:

* generated dataset shape
* fraud ratio
* V1 metrics
* V2 metrics
* whether the intended regression is actually visible

If metrics are bad or unrealistic, fix the generator/training logic.

## Phase 2 — Refactor

Improve structure.

Save model artifacts.

Add metadata.

Create stable prediction interface.

## Phase 3 — Evaluation and policy

Produce evaluation JSON.

Add HEALTHY/WARNING/CRITICAL logic.

## Phase 4 — Tests and documentation

Add tests.

Add README.

## Phase 5 — AWS integration

Package models for SageMaker.

Write deployment/inference integration.

---

# 18. How I Want You to Behave

Act like a senior engineer pair-programming with me.

Before each significant code change:

1. Briefly explain what you are building.
2. Explain why it matters.
3. Implement it.
4. Run the relevant code/tests.
5. Inspect actual output.
6. Fix failures instead of assuming the code works.
7. Summarize what is now complete.
8. Tell me the next smallest useful step.

Do not invent metrics. Execute the scripts and use real generated results.

Do not pretend AWS deployment succeeded if credentials or infrastructure are unavailable.

Do not silently mock production services. If something is mocked, label it explicitly.

Do not over-engineer.

Favor a working hackathon demo over unnecessary abstraction.

---

# 19. Definition of Done

My Person 1 task is complete when:

* [ ] Local fallback remains runnable if AWS fails.
* [ ] Synthetic transaction data generator works reproducibly.
* [ ] Train dataset exists.
* [ ] Evaluation dataset exists.
* [ ] Live-stream demo dataset exists.
* [ ] Fraud Model V1 is trained and saved.
* [ ] Fraud Model V2 is trained and saved.
* [ ] V2 contains a believable controlled regression.
* [ ] Both models use the same input schema.
* [ ] `predict_transaction()` works for V1 and V2.
* [ ] Fraud probabilities are returned.
* [ ] Evaluation calculates precision, recall, FPR and other key metrics.
* [ ] V1 clearly passes the production thresholds.
* [ ] V2 clearly violates at least one meaningful threshold in the demo scenario.
* [ ] Evaluation results are available as JSON.
* [ ] Model metadata/version information is available.
* [ ] Basic tests pass.
* [ ] README explains assumptions and limitations.
* [ ] Model artifacts are ready for SageMaker integration.

Start with **Phase 1 only**.

First inspect the existing repository if there is one. Do not overwrite useful work.

Then propose the minimal file plan and immediately implement the synthetic transaction generator, train V1 and V2, run evaluation, and show me the actual results before proceeding further.
