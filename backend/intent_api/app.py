from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model_service import IntentModelService


LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()
MODEL_PATH = Path(os.getenv("INTENT_MODEL_PATH", Path(__file__).resolve().parent / "models" / "intent_model.pkl"))
CORPUS_PATH = os.getenv("INTENT_CORPUS_PATH")
SPELL_THRESHOLD = int(os.getenv("SPELL_CORRECTION_THRESHOLD", "82"))
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("intent_api")


class PredictRequest(BaseModel):
    text: str | None = Field(default=None, description="User command text")
    command: str | None = Field(default=None, description="Optional alias for text")

    def resolved_text(self) -> str:
        return (self.text or self.command or "").strip()


class PredictResponse(BaseModel):
    input: str
    corrected: str
    intent: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    service = IntentModelService(
        model_path=MODEL_PATH,
        corpus_path=CORPUS_PATH,
        spell_threshold=SPELL_THRESHOLD,
    )

    try:
        service.load()
        logger.info("Loaded intent model from %s", MODEL_PATH)
    except Exception:
        logger.exception("Intent model could not be loaded at startup")

    app.state.intent_service = service
    yield


app = FastAPI(
    title="Intent Classification API",
    version="1.0.0",
    description="FastAPI service for a trained intent classification model with RapidFuzz spell correction.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_service(request: Request) -> IntentModelService:
    service = getattr(request.app.state, "intent_service", None)
    if service is None:
        raise HTTPException(status_code=503, detail="Model service is not initialized.")
    return service


@app.get("/health")
def health(request: Request):
    service = getattr(request.app.state, "intent_service", None)
    ready = bool(service and service.is_ready)
    return {
        "status": "ok" if ready else "degraded",
        "ready": ready,
        "model_path": str(MODEL_PATH),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest, request: Request):
    service = get_service(request)
    text = payload.resolved_text()
    if not text:
        raise HTTPException(status_code=422, detail="text is required")

    if not service.is_ready:
        raise HTTPException(status_code=503, detail="Model file is not available or failed to load.")

    try:
        result = service.predict_intent(text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed") from exc

    return result


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app:app", host=host, port=port, reload=False)

