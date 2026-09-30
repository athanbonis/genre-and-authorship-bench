from pathlib import Path

import pytest

from gabench.data import genre, pan18
from gabench.data.protocols import stratified_kfold


def test_kfold_has_no_overlap_and_covers_everything(corpus):
    splits = list(stratified_kfold(corpus, folds=5, seed=0))
    assert len(splits) == 5
    tested = []
    for s in splits:
        train_ids = {d.doc_id for d in s.train}
        test_ids = {d.doc_id for d in s.test}
        assert not train_ids & test_ids
        tested += test_ids
    assert sorted(tested) == sorted(d.doc_id for d in corpus.documents)


def test_kfold_is_deterministic_per_seed(corpus):
    ids = lambda seed: [[d.doc_id for d in s.test] for s in stratified_kfold(corpus, 5, seed)]  # noqa: E731
    assert ids(0) == ids(0)
    assert ids(0) != ids(1)


def test_ki04_label_is_file_name_prefix(tmp_path: Path, monkeypatch):
    for name in ["portrait-non_priv_123.TXT", "shop_456.TXT"]:
        (tmp_path / name).write_text("x", encoding="latin-1")
    monkeypatch.setattr(genre, "KI04_SIZE", 2)
    corpus = genre.load_ki04(tmp_path)
    assert sorted(corpus.labels) == ["portrait-non_priv", "shop"]


def test_7genre_label_is_directory(tmp_path: Path, monkeypatch):
    for g in ["BLOG", "FAQ"]:
        (tmp_path / g).mkdir()
        (tmp_path / g / "page.txt").write_text("caf\xe9", encoding="latin-1")
    monkeypatch.setattr(genre, "SEVEN_GENRE_SIZE", 2)
    corpus = genre.load_7genre(tmp_path)
    assert corpus.labels == ["BLOG", "FAQ"]
    assert corpus.documents[0].text == "caf\xe9"


def test_corpus_size_is_checked(tmp_path: Path):
    (tmp_path / "shop_1.TXT").write_text("x")
    with pytest.raises(ValueError, match="expected 1205"):
        genre.load_ki04(tmp_path)


def test_pan18_uses_official_split(pan18_root: Path, monkeypatch):
    monkeypatch.setattr(pan18, "N_PROBLEMS", 2)
    splits = pan18.load_pan18(pan18_root)
    assert [s.language for s in splits] == ["en", "fr"]
    first = splits[0]
    assert len(first.train) == 6 and len(first.test) == 2
    assert first.label_set == ["candidate00001", "candidate00002"]
    assert [d.label for d in first.test] == ["candidate00001", "candidate00002"]
