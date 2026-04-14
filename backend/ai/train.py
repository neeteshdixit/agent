from __future__ import annotations

import json
from intent_model import CommandIntelligenceModel


def main() -> None:
    model = CommandIntelligenceModel()
    result = model.train(force=True)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
