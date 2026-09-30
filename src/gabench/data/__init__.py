"""Corpora, loaders and evaluation splits."""

from gabench.data.base import Corpus, Document, Split
from gabench.data.registry import DATASETS, load_splits

__all__ = ["DATASETS", "Corpus", "Document", "Split", "load_splits"]
