"""PAN-18 cross-domain authorship attribution (fanfiction), development corpus.

Each of the 20 problems (5 languages) has its own candidate authors, "known" training texts
from one fandom and "unknown" test texts from another. The official train/test split is used
as is. The official measure is macro-F1 over the candidate authors, averaged over problems.
"""

from __future__ import annotations

import json
from pathlib import Path

from gabench.data.base import Document, Split

N_PROBLEMS = 20


def load_pan18(root: Path) -> list[Split]:
    collection = json.loads((root / "collection-info.json").read_text(encoding="utf-8"))
    if len(collection) != N_PROBLEMS:
        raise ValueError(f"PAN-18: expected {N_PROBLEMS} problems, found {len(collection)}")
    return [_load_problem(root / p["problem-name"], p["language"]) for p in collection]


def _load_problem(path: Path, language: str) -> Split:
    info = json.loads((path / "problem-info.json").read_text(encoding="utf-8"))
    train = []
    for author in (a["author-name"] for a in info["candidate-authors"]):
        for f in sorted((path / author).glob("*.txt")):
            train.append(Document(f"{author}/{f.name}", _read(f), author))

    truth = json.loads((path / "ground-truth.json").read_text(encoding="utf-8"))
    unknown_dir = path / info["unknown-folder"]
    test = [
        Document(t["unknown-text"], _read(unknown_dir / t["unknown-text"]), t["true-author"])
        for t in truth["ground_truth"]
    ]
    return Split("pan18", path.name, language, tuple(train), tuple(test))


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")
