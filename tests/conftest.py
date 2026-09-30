import json
from pathlib import Path

import pytest

from gabench.data.base import Corpus, Document

STYLES = {
    "a": "The cat sat on the mat. The cat is happy. ",
    "b": "Quantum fields oscillate; entropy rises!! ",
    "c": "buy now, cheap price, free shipping, order today ",
}


def make_docs(per_label: int = 10) -> tuple[Document, ...]:
    docs = []
    for label, text in STYLES.items():
        for i in range(per_label):
            docs.append(Document(f"{label}{i}", text * (3 + i % 4) + f"extra {i}", label))
    return tuple(docs)


@pytest.fixture
def corpus() -> Corpus:
    return Corpus("toy", "genre", "en", make_docs())


@pytest.fixture
def pan18_root(tmp_path: Path) -> Path:
    """A minimal corpus in the PAN-18 on-disk layout (one problem per language)."""
    root = tmp_path / "pan18"
    collection = []
    for p, lang in enumerate(["en", "fr"], start=1):
        name = f"problem{p:05d}"
        collection.append({"problem-name": name, "language": lang, "encoding": "UTF-8"})
        prob = root / name
        authors = [f"candidate{i:05d}" for i in (1, 2)]
        for author, style in zip(authors, ["a", "b"], strict=True):
            (prob / author).mkdir(parents=True)
            for k in range(3):
                (prob / author / f"known{k:05d}.txt").write_text(STYLES[style] * 5)
        (prob / "unknown").mkdir()
        truth = []
        for k, (author, style) in enumerate(zip(authors, ["a", "b"], strict=True), start=1):
            (prob / "unknown" / f"unknown{k:05d}.txt").write_text(STYLES[style] * 4)
            truth.append({"unknown-text": f"unknown{k:05d}.txt", "true-author": author})
        info = {
            "unknown-folder": "unknown",
            "candidate-authors": [{"author-name": a} for a in authors],
        }
        (prob / "problem-info.json").write_text(json.dumps(info))
        (prob / "ground-truth.json").write_text(json.dumps({"ground_truth": truth}))
    (root / "collection-info.json").write_text(json.dumps(collection))
    return root
