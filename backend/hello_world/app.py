import json
import os
import uuid
from decimal import Decimal
from datetime import datetime, timezone

import boto3

dynamodb = boto3.resource("dynamodb")

TABLE_NAME = os.environ.get("TRANSACTION_TABLE")
table = dynamodb.Table(TABLE_NAME) if TABLE_NAME else None


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body, default=str)
    }


def lambda_handler(event, context):
    try:
        path = event.get("path", "")
        method = event.get("httpMethod", "")

        if method == "POST" and path == "/transaction":
            return create_transaction(event)

        if method == "GET" and path == "/metrics":
            return get_metrics(event)

        if method == "GET" and path == "/model-status":
            return response(200, {"stub": "model-status"})

        if method == "POST" and path == "/deploy":
            return deploy_model(event)

        if method == "POST" and path == "/simulate-failure":
            return simulate_failure(event)

        return response(404, {"error": "Endpoint not found"})

    except Exception as e:
        print(f"Lambda error: {str(e)}")
        return response(500, {"error": "Internal server error"})


def create_transaction(event):
    body = json.loads(event.get("body") or "{}")

    user_id = body.get("user_id")
    amount = body.get("amount")
    merchant = body.get("merchant")
    country = body.get("country")

    if not user_id or amount is None:
        return response(400, {"error": "user_id and amount are required"})

    transaction_id = str(uuid.uuid4())

    transaction = {
        "transaction_id": transaction_id,
        "user_id": user_id,
        "amount": Decimal(str(amount)),
        "merchant": merchant,
        "country": country,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "received"
    }

    table.put_item(Item=transaction)

    return response(201, {
        "transaction_id": transaction_id,
        "status": "received"
    })


def get_metrics(event):
    result = table.scan(Select="COUNT")
    transaction_count = result.get("Count", 0)

    return response(200, {
        "transactions": transaction_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


def deploy_model(event):
    body = json.loads(event.get("body") or "{}")

    model_version = body.get("model_version", "latest")

    print(f"Starting deployment for {model_version}")

    # Real deployment call goes here later, e.g.:
    # sagemaker.update_endpoint(...)

    return response(202, {
        "status": "deployment_started",
        "model_version": model_version
    })


def simulate_failure(event):
    import time

    body = json.loads(event.get("body") or "{}")

    failure_type = body.get("failure_type", "generic")

    if failure_type == "latency":
        time.sleep(3)
        return response(200, {
            "simulation": "latency",
            "status": "completed"
        })

    if failure_type == "error":
        raise Exception("Simulated system failure")

    if failure_type == "model":
        return response(503, {
            "simulation": "model_failure",
            "error": "Simulated model unavailable"
        })

    return response(400, {"error": "Unknown failure type"})