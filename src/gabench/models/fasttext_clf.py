"""fastText supervised classifier (Joulin et al., 2017)."""

from __future__ import annotations

import os
import re
import tempfile
from collections.abc import Sequence

import fasttext

from gabench.models.base import TextClassifier, register

_WHITESPACE = re.compile(r"\s+")


@register("fasttext")
class FastTextClassifier(TextClassifier):
    """fastText with word n-grams, trained from scratch.

    Runs single-threaded so that results are reproducible for a given seed.
    """

    def __init__(
        self,
        epoch: int = 25,
        lr: float = 0.5,
        dim: int = 100,
        word_ngrams: int = 2,
        minn: int = 0,
        maxn: int = 0,
        min_count: int = 1,
    ) -> None:
        self.params = {
            "epoch": epoch,
            "lr": lr,
            "dim": dim,
            "wordNgrams": word_ngrams,
            "minn": minn,
            "maxn": maxn,
            "minCount": min_count,
        }

    def fit(self, texts: Sequence[str], labels: Sequence[str], seed: int = 0) -> FastTextClassifier:
        # Labels are mapped to indices so that any label string is a valid fastText token.
        self.labels_ = sorted(set(labels))
        index = {label: i for i, label in enumerate(self.labels_)}
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
            for text, label in zip(texts, labels, strict=True):
                f.write(f"__label__{index[label]} {_clean(text)}\n")
            path = f.name
        try:
            self.model_ = fasttext.train_supervised(
                path, seed=seed, thread=1, verbose=0, **self.params
            )
        finally:
            os.unlink(path)
        return self

    def predict(self, texts: Sequence[str]) -> list[str]:
        # The low-level predictor avoids fastText's NumPy 2 incompatibility in `predict`.
        preds = [self.model_.f.predict(_clean(t), 1, 0.0, "strict")[0][1] for t in texts]
        return [self.labels_[int(p.removeprefix("__label__"))] for p in preds]


def _clean(text: str) -> str:
    return _WHITESPACE.sub(" ", text).strip()
