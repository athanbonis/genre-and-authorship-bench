"""Core data types shared by every dataset."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Document:
    """A single labelled text."""

    doc_id: str
    text: str
    label: str


@dataclass(frozen=True)
class Corpus:
    """A labelled collection that is split by an evaluation protocol (e.g. k-fold CV)."""

    name: str
    task: str
    language: str
    documents: tuple[Document, ...]

    @property
    def labels(self) -> list[str]:
        return [d.label for d in self.documents]


@dataclass(frozen=True)
class Split:
    """One train/test evaluation unit.

    Everything a model may learn from (vocabularies, scalers, language-model fine-tuning)
    must come from ``train`` only. ``test`` is used for predictions and scoring.
    """

    dataset: str
    split_id: str
    language: str
    train: tuple[Document, ...]
    test: tuple[Document, ...]
    seed: int = 0

    @property
    def label_set(self) -> list[str]:
        """Candidate labels, taken from the training documents only."""
        return sorted({d.label for d in self.train})
