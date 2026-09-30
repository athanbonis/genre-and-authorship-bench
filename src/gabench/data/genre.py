"""Web genre corpora: 7-genre (Santini) and KI-04 (Meyer zu Eissen & Stein)."""

from __future__ import annotations

from pathlib import Path

from gabench.data.base import Corpus, Document

# Both corpora are distributed as Latin-1 text extracted from HTML pages.
ENCODING = "latin-1"

SEVEN_GENRE_SIZE = 1400
KI04_SIZE = 1205


def _read(path: Path) -> str:
    return path.read_text(encoding=ENCODING)


def load_7genre(root: Path) -> Corpus:
    """Load 7-genre: one sub-directory per genre, 200 pages each."""
    docs = []
    for genre_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        for f in sorted(genre_dir.iterdir()):
            if f.is_file():
                docs.append(Document(f"{genre_dir.name}/{f.name}", _read(f), genre_dir.name))
    _check_size("7-genre", len(docs), SEVEN_GENRE_SIZE)
    return Corpus("7genre", "genre", "en", tuple(docs))


def load_ki04(root: Path) -> Corpus:
    """Load KI-04: a flat directory where the genre is the file-name prefix.

    Example: ``portrait-non_priv_5262883583.TXT`` has the label ``portrait-non_priv``.
    """
    docs = []
    for f in sorted(p for p in root.iterdir() if p.is_file()):
        label = f.stem.rsplit("_", 1)[0]
        docs.append(Document(f.name, _read(f), label))
    _check_size("KI-04", len(docs), KI04_SIZE)
    return Corpus("ki04", "genre", "en", tuple(docs))


def _check_size(name: str, found: int, expected: int) -> None:
    if found != expected:
        raise ValueError(f"{name}: expected {expected} documents, found {found}")
