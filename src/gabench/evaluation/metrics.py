"""Evaluation metrics."""

from __future__ import annotations

from collections.abc import Sequence

from sklearn.metrics import accuracy_score, f1_score


def score(y_true: Sequence[str], y_pred: Sequence[str], labels: Sequence[str]) -> dict[str, float]:
    """Accuracy and macro-F1.

    Macro-F1 averages over ``labels`` (the candidate set from the training data), as in the
    official PAN-18 evaluation, so a candidate that is never predicted counts as F1 = 0.
    """
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_f1": float(
            f1_score(y_true, y_pred, labels=list(labels), average="macro", zero_division=0)
        ),
    }
