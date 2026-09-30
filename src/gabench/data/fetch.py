"""Download the raw corpora.

For now all three corpora come from the archived 2019 thesis repository, which keeps
them unchanged. See docs/datasets.md for provenance and terms of use.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from gabench.data.paths import raw_dir

THESIS_REPO = "https://github.com/athanbonis/Thesis.git"
THESIS_PATHS = [
    "website-genres-classification/7-genre",
    "website-genres-classification/KI-04",
    "pan18/datasets",
]


def fetch_thesis_corpora(source: str = THESIS_REPO, force: bool = False) -> Path:
    """Copy the corpora from the thesis repository (a git URL or a local checkout)."""
    target = raw_dir() / "thesis-2019"
    if target.exists():
        if not force:
            return target
        shutil.rmtree(target)
    target.parent.mkdir(parents=True, exist_ok=True)

    local = Path(source)
    if local.is_dir():
        for rel in THESIS_PATHS:
            shutil.copytree(local / rel, target / rel)
        return target

    subprocess.run(
        ["git", "clone", "--depth", "1", "--filter=blob:none", "--sparse", source, str(target)],
        check=True,
    )
    subprocess.run(["git", "-C", str(target), "sparse-checkout", "set", *THESIS_PATHS], check=True)
    shutil.rmtree(target / ".git")
    return target
