"""Common interface and registry for all classifiers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Callable, Sequence
from typing import Any

_REGISTRY: dict[str, type[TextClassifier]] = {}


class TextClassifier(ABC):
    """A classifier that learns from raw texts and labels.

    Implementations must learn everything (vocabularies, scaling, embeddings, fine-tuning)
    from the texts passed to ``fit`` only, so that no information leaks from test data.
    """

    name: str

    @abstractmethod
    def fit(self, texts: Sequence[str], labels: Sequence[str], seed: int = 0) -> TextClassifier:
        """Train on the given texts and return ``self``."""

    @abstractmethod
    def predict(self, texts: Sequence[str]) -> list[str]:
        """Predict one label per text."""


def register(name: str) -> Callable[[type[TextClassifier]], type[TextClassifier]]:
    def decorator(cls: type[TextClassifier]) -> type[TextClassifier]:
        cls.name = name
        _REGISTRY[name] = cls
        return cls

    return decorator


def build_model(name: str, params: dict[str, Any] | None = None) -> TextClassifier:
    # Import implementations so that they register themselves.
    from gabench.models import fasttext_clf, ngram_svm  # noqa: F401

    if name not in _REGISTRY:
        raise KeyError(f"unknown model {name!r}; available: {sorted(_REGISTRY)}")
    return _REGISTRY[name](**(params or {}))
