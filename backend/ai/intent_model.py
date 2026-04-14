from __future__ import annotations

import json
import os
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional
from threading import Lock

import joblib
from rapidfuzz import fuzz, process
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 5100
DEFAULT_THRESHOLD = 0.35
REWARD_ALPHA = 0.35

INTENT_TO_ACTION = {
    "open_local_app": "open_local_app",
    "open_browser_app": "open_browser_app",
    "youtube_play": "youtube_play",
    "search_web": "search_web",
    "send_email": "send_email",
    "send_whatsapp_message": "send_whatsapp_message",
    "open_folder": "open_folder",
    "play_music": "play_music",
    "chat_only": "chat_only",
}

SUPPORTED_INTENTS = tuple(INTENT_TO_ACTION.keys())

LOCAL_APPS = [
    ("whatsapp", ["whatsapp", "whats app"]),
    ("chrome", ["chrome", "google chrome"]),
    ("word", ["word", "microsoft word"]),
    ("excel", ["excel", "microsoft excel"]),
    ("powerpoint", ["powerpoint", "ppt"]),
    ("notepad", ["notepad"]),
    ("calculator", ["calculator", "calc"]),
    ("spotify", ["spotify"]),
    ("telegram", ["telegram"]),
    ("vscode", ["vscode", "visual studio code"]),
    ("edge", ["edge", "microsoft edge"]),
    ("vlc", ["vlc"]),
    ("file explorer", ["file explorer", "explorer"]),
    ("discord", ["discord"]),
    ("zoom", ["zoom"]),
    ("slack", ["slack"]),
    ("outlook", ["outlook"]),
    ("photoshop", ["photoshop"]),
    ("obs", ["obs"]),
    ("pycharm", ["pycharm"]),
    ("intellij", ["intellij"]),
    ("android studio", ["android studio"]),
    ("docker desktop", ["docker desktop"]),
    ("postman", ["postman"]),
    ("figma", ["figma"]),
    ("canva", ["canva"]),
    ("audacity", ["audacity"]),
]

FOLDER_ALIASES = {
    "downloads": ["download", "downloads", "download folder"],
    "documents": ["document", "documents", "docs", "doc folder"],
    "desktop": ["desktop"],
    "pictures": ["picture", "pictures", "photos", "images"],
    "music": ["music", "songs", "song folder"],
    "videos": ["video", "videos", "movies"],
}

BROWSER_APPS = {
    "whatsapp": "whatsapp_web",
    "youtube": "youtube",
    "gmail": "gmail",
    "mail": "gmail",
}

EMAIL_REGEX = re.compile(r"([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})", re.IGNORECASE)
PHONE_REGEX = re.compile(r"\+?\d[\d\s()-]{7,}\d")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def normalize_for_similarity(value: Any) -> str:
    return re.sub(r"[^a-z0-9@+\s]", " ", normalize_text(value))


def compact(value: Any) -> str:
    return normalize_text(value).replace("  ", " ").strip()


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def ensure_directory(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def read_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback

    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (json.JSONDecodeError, OSError):
        return fallback


def write_json(path: Path, payload: Any) -> None:
    ensure_directory(path)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=True, indent=2, sort_keys=False)
    tmp_path.replace(path)


def infer_route(action: str, args: Optional[Dict[str, Any]] = None) -> str:
    args = args or {}
    if action in {"open_browser_app", "youtube_play", "search_web"}:
        return "browser"
    if action == "send_whatsapp_message" and normalize_text(args.get("browser")) == "chrome":
        return "browser"
    if action == "chat_only":
        return "chat"
    return "local"


def strip_browser_hints(value: str) -> str:
    return compact(
        re.sub(
            r"\b(on|in|using)\s+chrome\b|\b(on|in)\s+youtube\b",
            " ",
            value,
            flags=re.IGNORECASE,
        )
    )


def extract_app_name(text: str) -> str:
    cleaned = normalize_text(text)
    for app, aliases in LOCAL_APPS:
        if any(alias in cleaned for alias in aliases):
            return app

    match = re.search(
        r"\b(?:open|launch|start|run)\s+(.+?)(?:\s+(?:in|on|with|using)\b|$)",
        cleaned,
        flags=re.IGNORECASE,
    )
    if not match:
        return ""

    candidate = match.group(1)
    candidate = re.sub(r"\b(?:my pc|computer|software|app|installed|folder)\b", " ", candidate, flags=re.IGNORECASE)
    return compact(candidate)


def extract_folder_name(text: str) -> str:
    cleaned = normalize_text(text)
    if not re.search(r"\b(open|show)\b", cleaned):
        return ""

    for folder, aliases in FOLDER_ALIASES.items():
        if any(alias in cleaned for alias in aliases):
            return folder

    return ""


def extract_browser_app(text: str) -> Dict[str, str]:
    cleaned = normalize_text(text)
    for keyword, app in BROWSER_APPS.items():
        if keyword in cleaned:
            return {"app": app, "browser": "chrome"}
    return {"app": "", "browser": "chrome"}


def extract_search_query(text: str) -> str:
    cleaned = strip_browser_hints(text)
    match = re.search(r"\b(?:search|google|find|look up|lookup)\s+(.+)$", cleaned, flags=re.IGNORECASE)
    if not match:
        return compact(cleaned)
    return compact(match.group(1))


def extract_youtube_query(text: str) -> str:
    cleaned = strip_browser_hints(text)

    playlist_match = re.search(
        r"\b(?:open|play|show)?\s*playlist(?:\s+of|\s+for)?\s+(.+)$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if playlist_match:
        query = compact(
            re.sub(r"\b(?:any\s+youtuber|any\s+channel|youtuber|channel)\b", " ", playlist_match.group(1), flags=re.IGNORECASE)
        )
        if "playlist" not in query:
            query = f"{query} playlist".strip()
        return query

    play_match = re.search(r"\bplay\s+(.+)$", cleaned, flags=re.IGNORECASE)
    if not play_match:
        return "music"

    query = re.sub(r"\b(?:song|music)\b", " ", play_match.group(1), flags=re.IGNORECASE)
    return compact(query) or "music"


def extract_email_payload(text: str) -> Dict[str, str]:
    cleaned = normalize_text(text)
    email = EMAIL_REGEX.search(cleaned)
    if not email:
        return {"to": "", "message": ""}

    explicit_body = re.search(
        r"send\s+(?:mail|email)\s+to\s+[^\s]+\s+(?:saying|say|message|body)\s+(.+)$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if explicit_body:
        return {"to": email.group(1), "message": compact(explicit_body.group(1))}

    body_before_to = re.search(
        r"send\s+(?:mail|email)\s+(.+?)\s+to\s+[^\s]+",
        cleaned,
        flags=re.IGNORECASE,
    )
    if body_before_to:
        return {"to": email.group(1), "message": compact(body_before_to.group(1))}

    return {"to": email.group(1), "message": "hello"}


def extract_whatsapp_payload(text: str) -> Dict[str, str]:
    original = compact(text)
    normalized = re.sub(r"^open\s+whatsapp\s+and\s+", "", original, flags=re.IGNORECASE)
    normalized = re.sub(r"\s+(?:on|in)\s+chrome\b", "", normalized, flags=re.IGNORECASE)

    match = re.search(r"send\s+(?:a\s+)?(?:whatsapp\s+)?(?:message\s+)?to\s+(.+)$", normalized, flags=re.IGNORECASE)
    if not match:
        return {"contact": "", "message": ""}

    rest = compact(match.group(1))
    explicit = re.search(r"(.+?)\s+(?:saying|say|message|that|:)\s+(.+)$", rest, flags=re.IGNORECASE)
    if explicit:
        return {
            "contact": compact(explicit.group(1)),
            "message": compact(explicit.group(2)),
        }

    tokens = rest.split()
    if tokens and PHONE_REGEX.fullmatch(tokens[0]):
        return {
            "contact": tokens[0],
            "message": " ".join(tokens[1:]).strip(),
        }

    if len(tokens) >= 4:
        return {
            "contact": " ".join(tokens[:2]).strip(),
            "message": " ".join(tokens[2:]).strip(),
        }
    if len(tokens) == 3:
        return {
            "contact": tokens[0],
            "message": " ".join(tokens[1:]),
        }

    return {"contact": rest, "message": ""}


def extract_music_payload(text: str) -> Dict[str, str]:
    cleaned = normalize_text(text)
    path_match = re.search(r"([a-z]:\\[^\\]+(?:\\[^\\]+)+)", cleaned, flags=re.IGNORECASE)
    if path_match:
        return {"songPath": path_match.group(1)}

    quoted_match = re.search(r"['\"](.+?)['\"]", cleaned)
    if quoted_match:
        return {"songPath": quoted_match.group(1)}

    return {"songPath": ""}


def extract_arguments(action: str, command: str) -> Dict[str, Any]:
    text = compact(command)

    if action == "open_local_app":
        return {"app": extract_app_name(text)}

    if action == "open_browser_app":
        payload = extract_browser_app(text)
        return payload

    if action == "youtube_play":
        return {"query": extract_youtube_query(text), "browser": "chrome"}

    if action == "search_web":
        return {"query": extract_search_query(text)}

    if action == "send_email":
        return extract_email_payload(text)

    if action == "send_whatsapp_message":
        payload = extract_whatsapp_payload(text)
        if "chrome" in text:
            payload["browser"] = "chrome"
        return payload

    if action == "open_folder":
        return {"folder": extract_folder_name(text)}

    if action == "play_music":
        return extract_music_payload(text)

    return {}


class CommandIntelligenceModel:
    def __init__(
        self,
        dataset_path: Optional[str] = None,
        memory_path: Optional[str] = None,
        model_path: Optional[str] = None,
    ) -> None:
        base_dir = Path(__file__).resolve().parent
        self.dataset_path = Path(dataset_path or os.getenv("AI_DATASET_PATH") or (base_dir / "data" / "command_dataset.json"))
        self.memory_path = Path(memory_path or os.getenv("AI_MEMORY_PATH") or (base_dir / "data" / "reinforcement_memory.json"))
        self.model_path = Path(model_path or os.getenv("AI_MODEL_PATH") or (base_dir / "models" / "intent_model.joblib"))
        self.pipeline: Optional[Pipeline] = None
        self.metadata: Dict[str, Any] = {}
        self.correction_corpus: List[str] = []
        self._train_lock = Lock()

    # ---------------------------------------------------------------------
    # Persistence
    # ---------------------------------------------------------------------
    def load_dataset(self) -> Dict[str, Any]:
        payload = read_json(
            self.dataset_path,
            {"version": 1, "updated_at": now_iso(), "examples": []},
        )

        if isinstance(payload, list):
            payload = {"version": 1, "updated_at": now_iso(), "examples": payload}

        payload.setdefault("version", 1)
        payload.setdefault("updated_at", now_iso())
        payload.setdefault("examples", [])
        return payload

    def save_dataset(self, payload: Dict[str, Any]) -> None:
        payload["updated_at"] = now_iso()
        write_json(self.dataset_path, payload)

    def load_memory(self) -> Dict[str, Any]:
        payload = read_json(
            self.memory_path,
            {"version": 1, "updated_at": now_iso(), "states": {}, "feedback_events": []},
        )

        if not isinstance(payload, dict):
            payload = {"version": 1, "updated_at": now_iso(), "states": {}, "feedback_events": []}

        payload.setdefault("version", 1)
        payload.setdefault("updated_at", now_iso())
        payload.setdefault("states", {})
        payload.setdefault("feedback_events", [])
        return payload

    def save_memory(self, payload: Dict[str, Any]) -> None:
        payload["updated_at"] = now_iso()
        write_json(self.memory_path, payload)

    # ---------------------------------------------------------------------
    # Training and loading
    # ---------------------------------------------------------------------
    def build_pipeline(self) -> Pipeline:
        return Pipeline(
            steps=[
                (
                    "vectorizer",
                    TfidfVectorizer(
                        analyzer="char_wb",
                        ngram_range=(3, 5),
                        lowercase=True,
                        sublinear_tf=True,
                        min_df=1,
                    ),
                ),
                (
                    "classifier",
                    LogisticRegression(
                        max_iter=2000,
                        class_weight="balanced",
                        random_state=42,
                    ),
                ),
            ]
        )

    def _build_correction_corpus(self, examples: Iterable[Dict[str, Any]]) -> List[str]:
        corpus = {normalize_text(example.get("text")) for example in examples if example.get("text")}
        corpus.update(
            {
                "open whatsapp installed in my pc",
                "open whatsapp on chrome",
                "open youtube on chrome",
                "open gmail on chrome",
                "open downloads folder",
                "open documents folder",
                "open desktop folder",
                "play music",
                "search best ai tools",
                "send email to someone@example.com saying hello",
                "send whatsapp message to hr maam saying hello",
                "play shape of you on youtube on chrome",
                "open playlist of arijit singh on youtube",
            }
        )
        return sorted(corpus)

    def train(self, force: bool = False) -> Dict[str, Any]:
        with self._train_lock:
            dataset = self.load_dataset()
            examples = [
                example
                for example in dataset.get("examples", [])
                if normalize_text(example.get("text")) and normalize_text(example.get("intent"))
            ]

            if not examples:
                raise RuntimeError("The training dataset is empty.")

            texts = [normalize_text(example.get("text")) for example in examples]
            labels = [normalize_text(example.get("intent")) for example in examples]

            if len(set(labels)) < 2:
                raise RuntimeError("The training dataset must contain at least two intent labels.")

            pipeline = self.build_pipeline()

            metrics: Dict[str, Any] = {
                "total_examples": len(examples),
                "label_counts": dict(Counter(labels)),
            }

            if len(examples) >= 12 and len(set(labels)) >= 2:
                stratify = labels if min(Counter(labels).values()) >= 2 else None
                X_train, X_test, y_train, y_test = train_test_split(
                    texts,
                    labels,
                    test_size=min(0.25, max(0.2, 4 / len(examples))),
                    random_state=42,
                    stratify=stratify,
                )
                pipeline.fit(X_train, y_train)
                predictions = pipeline.predict(X_test)
                metrics["validation_accuracy"] = round(accuracy_score(y_test, predictions), 4)
                metrics["validation_report"] = classification_report(
                    y_test,
                    predictions,
                    zero_division=0,
                    output_dict=True,
                )
            else:
                pipeline.fit(texts, labels)
                metrics["validation_accuracy"] = 1.0
                metrics["validation_report"] = {}

            pipeline.fit(texts, labels)
            self.pipeline = pipeline
            self.correction_corpus = self._build_correction_corpus(examples)
            self.metadata = {
                "trained_at": now_iso(),
                "dataset_path": str(self.dataset_path),
                "memory_path": str(self.memory_path),
                "model_path": str(self.model_path),
                "dataset_size": len(examples),
                "labels": sorted(set(labels)),
                "validation_accuracy": metrics.get("validation_accuracy", 0.0),
            }

            ensure_directory(self.model_path)
            joblib.dump(
                {
                    "pipeline": self.pipeline,
                    "metadata": self.metadata,
                    "correction_corpus": self.correction_corpus,
                },
                self.model_path,
            )

            return {
                "status": "trained",
                "metadata": self.metadata,
                "metrics": metrics,
            }

    def load_or_train(self) -> Dict[str, Any]:
        if self.pipeline is not None and self.metadata:
            return {"status": "loaded", "metadata": self.metadata}

        if self.model_path.exists():
            artifact = joblib.load(self.model_path)
            self.pipeline = artifact.get("pipeline")
            self.metadata = artifact.get("metadata", {})
            self.correction_corpus = artifact.get("correction_corpus", [])
            if self.pipeline is not None:
                return {"status": "loaded", "metadata": self.metadata}

        return self.train(force=True)

    # ---------------------------------------------------------------------
    # Prediction
    # ---------------------------------------------------------------------
    def _memory_lookup(self, normalized_command: str) -> Dict[str, Any]:
        memory = self.load_memory()
        states = memory.get("states", {})
        if not normalized_command:
            return {"hit": False}

        direct = states.get(normalized_command)
        if direct:
            actions = direct.get("actions", {})
            if actions:
                best_action, best_payload = max(
                    actions.items(),
                    key=lambda item: safe_float(item[1].get("q"), 0.0),
                )
                return {
                    "hit": True,
                    "state": normalized_command,
                    "action": best_action,
                    "q_value": safe_float(best_payload.get("q"), 0.0),
                    "visits": safe_int(best_payload.get("visits"), 0),
                }

        best_match = process.extractOne(
            normalized_command,
            list(states.keys()),
            scorer=fuzz.WRatio,
        )
        if best_match and best_match[1] >= 95:
            state = best_match[0]
            actions = states[state].get("actions", {})
            if actions:
                best_action, best_payload = max(
                    actions.items(),
                    key=lambda item: safe_float(item[1].get("q"), 0.0),
                )
                return {
                    "hit": True,
                    "state": state,
                    "matched_by": "fuzzy",
                    "similarity": best_match[1],
                    "action": best_action,
                    "q_value": safe_float(best_payload.get("q"), 0.0),
                    "visits": safe_int(best_payload.get("visits"), 0),
                }

        return {"hit": False}

    def correct_command(self, command: str) -> Dict[str, Any]:
        normalized = normalize_text(command)
        if not normalized:
            return {
                "original": "",
                "corrected": "",
                "matched": False,
                "score": 0,
            }

        if not self.correction_corpus:
            self.load_or_train()

        if not self.correction_corpus:
            return {
                "original": normalized,
                "corrected": normalized,
                "matched": False,
                "score": 0,
            }

        match = process.extractOne(normalized, self.correction_corpus, scorer=fuzz.WRatio)
        if match and match[1] >= 86:
            return {
                "original": normalized,
                "corrected": match[0],
                "matched": True,
                "score": match[1],
            }

        return {
            "original": normalized,
            "corrected": normalized,
            "matched": False,
            "score": match[1] if match else 0,
        }

    def predict(self, command: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        self.load_or_train()

        normalized = normalize_text(command)
        correction = self.correct_command(normalized)
        model_text = correction["corrected"] or normalized

        memory_hit = self._memory_lookup(model_text)
        selected_intent = "chat_only"
        selected_source = "python_ml"
        confidence = 0.0

        if self.pipeline is None:
            raise RuntimeError("Model pipeline is not available.")

        class_scores = self.pipeline.predict_proba([model_text])[0]
        class_labels = list(self.pipeline.classes_)
        best_index = max(range(len(class_scores)), key=lambda index: class_scores[index])
        classifier_intent = normalize_text(class_labels[best_index])
        confidence = safe_float(class_scores[best_index], 0.0)
        selected_intent = classifier_intent if confidence >= DEFAULT_THRESHOLD else "chat_only"

        if memory_hit.get("hit") and safe_float(memory_hit.get("q_value"), 0.0) >= 0.55:
            selected_intent = normalize_text(memory_hit.get("action") or classifier_intent)
            selected_source = "reinforcement_memory"
            confidence = max(confidence, safe_float(memory_hit.get("q_value"), 0.0))
        elif correction["matched"]:
            selected_source = "fuzzy_correction"

        if selected_intent not in SUPPORTED_INTENTS:
            selected_intent = "chat_only"

        action = INTENT_TO_ACTION.get(selected_intent, "chat_only")
        args = extract_arguments(action, correction["corrected"] or normalized)
        route = infer_route(action, args)

        return {
            "command": command,
            "normalized_command": normalized,
            "corrected_command": correction["corrected"],
            "intent": selected_intent,
            "action": action,
            "args": args,
            "confidence": round(confidence, 4),
            "route": route,
            "source": selected_source,
            "memory_hit": bool(memory_hit.get("hit")),
            "memory_state": memory_hit.get("state", ""),
            "memory_q": round(safe_float(memory_hit.get("q_value"), 0.0), 4),
            "correction": {
                "matched": correction["matched"],
                "score": correction["score"],
            },
            "model": {
                "trained_at": self.metadata.get("trained_at"),
                "dataset_size": self.metadata.get("dataset_size", 0),
                "validation_accuracy": self.metadata.get("validation_accuracy", 0.0),
            },
        }

    # ---------------------------------------------------------------------
    # Feedback and reinforcement learning
    # ---------------------------------------------------------------------
    def _update_state_q_value(
        self,
        memory: Dict[str, Any],
        state: str,
        action: str,
        reward: float,
    ) -> Dict[str, Any]:
        states = memory.setdefault("states", {})
        state_entry = states.setdefault(state, {"actions": {}})
        action_entry = state_entry.setdefault("actions", {}).setdefault(
            action,
            {
                "q": 0.0,
                "visits": 0,
                "reward_sum": 0.0,
                "last_reward": 0.0,
                "updated_at": now_iso(),
            },
        )

        current_q = safe_float(action_entry.get("q"), 0.0)
        next_q = current_q + REWARD_ALPHA * (reward - current_q)
        action_entry["q"] = round(next_q, 6)
        action_entry["visits"] = safe_int(action_entry.get("visits"), 0) + 1
        action_entry["reward_sum"] = round(safe_float(action_entry.get("reward_sum"), 0.0) + reward, 6)
        action_entry["last_reward"] = reward
        action_entry["updated_at"] = now_iso()
        return action_entry

    def _append_supervised_example(self, dataset: Dict[str, Any], payload: Dict[str, Any]) -> bool:
        text = normalize_text(payload.get("corrected_command") or payload.get("command"))
        intent = normalize_text(payload.get("actual_intent") or payload.get("actual_action") or "")
        action = normalize_text(payload.get("actual_action") or intent)
        reward = safe_float(payload.get("reward"), 0.0)

        if not text or not intent or reward <= 0:
            return False

        examples = dataset.setdefault("examples", [])
        examples.append(
            {
                "text": text,
                "intent": intent,
                "action": action,
                "args": payload.get("args", {}) if isinstance(payload.get("args"), dict) else {},
                "reward": reward,
                "source": "feedback",
                "updated_at": now_iso(),
            }
        )
        return True

    def record_feedback(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command", "")
        normalized_command = normalize_text(payload.get("normalized_command") or command)
        corrected_command = normalize_text(payload.get("corrected_command") or command)
        predicted_action = normalize_text(payload.get("predicted_action") or payload.get("action") or "")
        actual_action = normalize_text(payload.get("actual_action") or predicted_action)
        predicted_intent = normalize_text(payload.get("predicted_intent") or predicted_action or actual_action)
        actual_intent = normalize_text(payload.get("actual_intent") or actual_action or predicted_intent)
        reward = safe_float(payload.get("reward"), 0.0)
        retrain = bool(payload.get("retrain", False))

        memory = self.load_memory()
        updated_entry = self._update_state_q_value(memory, corrected_command or normalized_command, actual_action or predicted_action, reward)

        feedback_events = memory.setdefault("feedback_events", [])
        feedback_events.append(
            {
                "command": command,
                "normalized_command": normalized_command,
                "corrected_command": corrected_command,
                "predicted_intent": predicted_intent,
                "predicted_action": predicted_action,
                "actual_intent": actual_intent,
                "actual_action": actual_action,
                "reward": reward,
                "status": payload.get("status", ""),
                "failure_reason": payload.get("failure_reason"),
                "created_at": now_iso(),
            }
        )
        self.save_memory(memory)

        dataset = self.load_dataset()
        appended = self._append_supervised_example(dataset, payload)
        if appended:
            self.save_dataset(dataset)

        training_summary: Dict[str, Any] = {}
        if retrain and reward > 0:
            training_summary = self.train(force=True)

        return {
            "status": "recorded",
            "reward": reward,
            "retrained": bool(training_summary),
            "dataset_size": len(dataset.get("examples", [])),
            "q_value": updated_entry.get("q"),
            "visits": updated_entry.get("visits"),
            "training": training_summary.get("metrics", {}),
        }

    # ---------------------------------------------------------------------
    # Service helpers
    # ---------------------------------------------------------------------
    def health(self) -> Dict[str, Any]:
        self.load_or_train()
        return {
            "status": "ok",
            "model_ready": self.pipeline is not None,
            "metadata": self.metadata,
            "dataset_path": str(self.dataset_path),
            "memory_path": str(self.memory_path),
            "model_path": str(self.model_path),
        }

    def summary(self) -> Dict[str, Any]:
        dataset = self.load_dataset()
        memory = self.load_memory()
        return {
            "dataset_size": len(dataset.get("examples", [])),
            "feedback_events": len(memory.get("feedback_events", [])),
            "trained_at": self.metadata.get("trained_at"),
            "validation_accuracy": self.metadata.get("validation_accuracy", 0.0),
        }
