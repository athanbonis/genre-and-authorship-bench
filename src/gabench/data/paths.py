"""Where raw data lives on disk."""

from __future__ import annotations

import os
from pathlib import Path


def data_root() -> Path:
    """Root data directory; override with the ``GABENCH_DATA`` environment variable."""
    return Path(os.environ.get("GABENCH_DATA", "data")).resolve()


def raw_dir() -> Path:
    return data_root() / "raw"
