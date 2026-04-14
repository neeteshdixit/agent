# Intent Classification FastAPI Service

This service loads a trained scikit-learn intent model from a pickle file and exposes a prediction API.

## Expected model artifact

Place your pickle file at:

```text
backend/intent_api/models/intent_model.pkl
```

The service expects either:

```python
{
    "model": sklearn_pipeline,
    "correction_corpus": ["open whatsapp", "open chrome", "..."],
    "metadata": {...}
}
```

or a pickled scikit-learn model object with a `predict()` method.

## Install

```bash
cd backend/intent_api
python -m pip install -r requirements.txt
```

## Run

Development:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Production:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 2
```

## Predict

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"opn whtsapp\"}"
```

Response:

```json
{
  "input": "opn whtsapp",
  "corrected": "open whatsapp",
  "intent": "open_whatsapp"
}
```

