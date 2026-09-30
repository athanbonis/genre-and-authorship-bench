"""Evaluation protocols that turn a corpus into train/test splits."""

from __future__ import annotations

from collections.abc import Iterator

from sklearn.model_selection import StratifiedKFold

from gabench.data.base import Corpus, Split


def stratified_kfold(corpus: Corpus, folds: int, seed: int) -> Iterator[Split]:
    """Stratified k-fold cross-validation; each document is tested exactly once per seed."""
    docs = corpus.documents
    skf = StratifiedKFold(n_splits=folds, shuffle=True, random_state=seed)
    for i, (train_idx, test_idx) in enumerate(skf.split(docs, corpus.labels)):
        yield Split(
            dataset=corpus.name,
            split_id=f"seed{seed}-fold{i}",
            language=corpus.language,
            train=tuple(docs[j] for j in train_idx),
            test=tuple(docs[j] for j in test_idx),
            seed=seed,
        )
