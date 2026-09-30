"""Dataset registry: maps a dataset name to its loader and evaluation protocol."""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from gabench.data.base import Split
from gabench.data.genre import load_7genre, load_ki04
from gabench.data.pan18 import load_pan18
from gabench.data.paths import raw_dir

# Location of each dataset relative to data/raw (see `gabench fetch`).
DATASETS = {
    "7genre": "thesis-2019/website-genres-classification/7-genre",
    "ki04": "thesis-2019/website-genres-classification/KI-04",
    "pan18": "thesis-2019/pan18/datasets",
}


def load_splits(name: str, protocol: dict[str, Any] | None = None) -> Iterator[Split]:
    """Yield the evaluation splits of a dataset under the given protocol."""
    from gabench.data.protocols import stratified_kfold

    protocol = protocol or {}
    root = raw_dir() / DATASETS[name]
    if not root.exists():
        raise FileNotFoundError(f"{root} not found; run `gabench fetch` first")

    if name == "pan18":
        yield from load_pan18(root)
        return

    corpus = load_7genre(root) if name == "7genre" else load_ki04(root)
    kind = protocol.get("type", "cv")
    if kind != "cv":
        raise ValueError(f"unsupported protocol for {name}: {kind}")
    for seed in protocol.get("seeds", [0]):
        yield from stratified_kfold(corpus, protocol.get("folds", 10), seed)
