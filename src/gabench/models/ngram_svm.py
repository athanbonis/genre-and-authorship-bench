"""Linear SVMs over character n-grams."""

from __future__ import annotations

from collections import Counter
from collections.abc import Sequence

import numpy as np
from scipy import sparse
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MaxAbsScaler
from sklearn.svm import LinearSVC

from gabench.models.base import TextClassifier, register


@register("pan18-baseline")
class Pan18Baseline(TextClassifier):
    """Re-implementation of the official PAN-18 cross-domain authorship baseline.

    Character n-grams of a single order that occur at least ``min_freq`` times in the
    training texts, counts divided by text length, max-abs scaling and a one-vs-rest
    linear SVM (Kestemont et al., 2018; code by E. Stamatatos).
    """

    def __init__(self, n: int = 3, min_freq: int = 5, c: float = 1.0) -> None:
        self.n, self.min_freq, self.c = n, min_freq, c

    def fit(self, texts: Sequence[str], labels: Sequence[str], seed: int = 0) -> Pan18Baseline:
        counts: Counter[str] = Counter()
        for text in texts:
            counts.update(text[i : i + self.n] for i in range(len(text) - self.n + 1))
        vocabulary = sorted(g for g, c in counts.items() if c >= self.min_freq)
        self.vectorizer_ = CountVectorizer(
            analyzer="char", ngram_range=(self.n, self.n), lowercase=False, vocabulary=vocabulary
        )
        self.scaler_ = MaxAbsScaler()
        x = self.scaler_.fit_transform(self._features(texts))
        svm = LinearSVC(C=self.c, dual=True, random_state=seed, max_iter=10_000)
        self.clf_ = OneVsRestClassifier(svm).fit(x, list(labels))
        return self

    def predict(self, texts: Sequence[str]) -> list[str]:
        return list(self.clf_.predict(self.scaler_.transform(self._features(texts))))

    def _features(self, texts: Sequence[str]) -> sparse.csr_matrix:
        x = self.vectorizer_.transform(texts).astype(float)
        lengths = np.array([max(len(t), 1) for t in texts], dtype=float)
        return sparse.diags(1.0 / lengths) @ x


@register("char-ngram-svm")
class CharNgramSvm(TextClassifier):
    """TF-IDF over character n-grams of several orders with a linear SVM.

    A standard, strong stylometric baseline. Hyperparameters are fixed in the config,
    never tuned on test data.
    """

    def __init__(
        self,
        ngram_min: int = 1,
        ngram_max: int = 4,
        min_df: int = 2,
        max_features: int | None = 200_000,
        c: float = 1.0,
    ) -> None:
        self.ngram_range = (ngram_min, ngram_max)
        self.min_df, self.max_features, self.c = min_df, max_features, c

    def fit(self, texts: Sequence[str], labels: Sequence[str], seed: int = 0) -> CharNgramSvm:
        self.pipeline_ = Pipeline(
            [
                (
                    "tfidf",
                    TfidfVectorizer(
                        analyzer="char",
                        ngram_range=self.ngram_range,
                        lowercase=False,
                        min_df=self.min_df,
                        max_features=self.max_features,
                        sublinear_tf=True,
                    ),
                ),
                ("svm", LinearSVC(C=self.c, random_state=seed, max_iter=10_000)),
            ]
        ).fit(list(texts), list(labels))
        return self

    def predict(self, texts: Sequence[str]) -> list[str]:
        return list(self.pipeline_.predict(list(texts)))
