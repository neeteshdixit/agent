from __future__ import annotations

import os
from flask import Flask, jsonify, request

from intent_model import CommandIntelligenceModel


MODEL = CommandIntelligenceModel()
MODEL.load_or_train()

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify(MODEL.health())


@app.get("/model")
def model_summary():
    return jsonify(MODEL.summary())


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    command = str(payload.get("command", "")).strip()
    if not command:
        return jsonify({"error": "command is required"}), 400

    user_id = payload.get("user_id")
    prediction = MODEL.predict(command=command, user_id=user_id)
    return jsonify(prediction)


@app.post("/feedback")
def feedback():
    payload = request.get_json(silent=True) or {}
    command = str(payload.get("command", "")).strip()
    if not command:
        return jsonify({"error": "command is required"}), 400

    result = MODEL.record_feedback(payload)
    return jsonify(result)


@app.post("/train")
def train():
    summary = MODEL.train(force=True)
    return jsonify(summary)


if __name__ == "__main__":
    host = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
    port = int(os.getenv("AI_SERVICE_PORT", "5100"))
    debug = os.getenv("AI_SERVICE_DEBUG", "false").lower() == "true"
    app.run(host=host, port=port, debug=debug)
