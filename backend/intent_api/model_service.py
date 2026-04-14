from __future__ import annotations

import json
import pickle
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Sequence

from rapidfuzz import fuzz, process


def normalize_text(value: Any) -> str:
    text = str(value or "").lower().strip()
    text = re.sub(r"[^a-z0-9@+\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def load_json_list(path: Path) -> list[str]:
    if not path.exists():
        return []

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []

    if isinstance(payload, list):
        items: Sequence[Any] = payload
    elif isinstance(payload, dict):
        items = payload.get("examples") or payload.get("phrases") or payload.get("corpus") or []
    else:
        items = []

    seen: set[str] = set()
    corpus: list[str] = []
    for item in items:
        normalized = normalize_text(item)
        if normalized and normalized not in seen:
            seen.add(normalized)
            corpus.append(normalized)

    return corpus


@dataclass(slots=True)
class ModelBundle:
    model: Any
    correction_corpus: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


class IntentModelService:
    def __init__(
        self,
        model_path: str | Path,
        corpus_path: str | Path | None = None,
        spell_threshold: int = 82,
    ) -> None:
        self.model_path = Path(model_path)
        self.corpus_path = Path(corpus_path) if corpus_path else None
        self.spell_threshold = int(spell_threshold)
        self.bundle: ModelBundle | None = None

    @property
    def is_ready(self) -> bool:
        return self.bundle is not None and self.bundle.model is not None

    def load(self) -> ModelBundle:
        if not self.model_path.exists():
            raise FileNotFoundError(f"Pickle model file not found: {self.model_path}")

        with self.model_path.open("rb") as handle:
            artifact = pickle.load(handle)

        bundle = self._unpack_artifact(artifact)
        if not bundle.correction_corpus and self.corpus_path:
            bundle.correction_corpus = load_json_list(self.corpus_path)

        if not bundle.correction_corpus and hasattr(bundle.model, "classes_"):
            bundle.correction_corpus = [
                normalize_text(label)
                for label in getattr(bundle.model, "classes_", [])
                if normalize_text(label)
            ]

        self.bundle = bundle
        return bundle

    def _unpack_artifact(self, artifact: Any) -> ModelBundle:
        if isinstance(artifact, ModelBundle):
            return artifact

        if isinstance(artifact, dict):
            model = (
                artifact.get("model")
                or artifact.get("pipeline")
                or artifact.get("classifier")
                or artifact.get("estimator")
            )
            correction_corpus = (
                artifact.get("correction_corpus")
                or artifact.get("spell_corpus")
                or artifact.get("known_phrases")
                or artifact.get("corpus")
                or []
            )
            metadata = artifact.get("metadata") or {}
        else:
            model = artifact
            correction_corpus = []
            metadata = {}

        if model is None:
            raise ValueError(
                "The pickle file must contain a scikit-learn model or a dict with a 'model'/'pipeline' key."
            )

        normalized_corpus = []
        seen: set[str] = set()
        for item in correction_corpus:
            normalized = normalize_text(item)
            if normalized and normalized not in seen:
                seen.add(normalized)
                normalized_corpus.append(normalized)

        return ModelBundle(model=model, correction_corpus=normalized_corpus, metadata=metadata)

    def correct_text(self, text: str) -> tuple[str, str]:
        normalized = normalize_text(text)
        if not normalized:
            return "", ""

        corpus = self.bundle.correction_corpus if self.bundle else []
        if not corpus:
            return normalized, normalized

        match = process.extractOne(normalized, corpus, scorer=fuzz.WRatio)
        if match and match[1] >= self.spell_threshold:
            return normalized, match[0]

        return normalized, normalized

    def predict_intent(self, text: str) -> dict[str, str]:
        if not self.is_ready:
            self.load()

        if self.bundle is None:
            raise RuntimeError("Model bundle is not loaded.")

        original, corrected = self.correct_text(text)
        input_text = corrected or original
        if not input_text:
            raise ValueError("Input text is required.")

        model = self.bundle.model
        if not hasattr(model, "predict"):
            raise TypeError("Loaded model does not expose a predict() method.")

        prediction = model.predict([input_text])
        if not prediction:
            raise RuntimeError("Model returned no prediction.")

        intent = str(prediction[0])
        return {
            "input": original,
            "corrected": corrected,
            "intent": intent,
        }

