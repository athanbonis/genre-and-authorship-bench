import pytest

from gabench.models import build_model

from .conftest import make_docs

MODELS = ["pan18-baseline", "char-ngram-svm", "fasttext"]


@pytest.mark.parametrize("name", MODELS)
def test_model_learns_separable_styles(name):
    docs = make_docs(per_label=8)
    train = [d for i, d in enumerate(docs) if i % 4]
    test = [d for i, d in enumerate(docs) if not i % 4]
    params = {"min_freq": 1} if name == "pan18-baseline" else {}
    model = build_model(name, params).fit([d.text for d in train], [d.label for d in train])
    predictions = model.predict([d.text for d in test])
    assert predictions == [d.label for d in test]


@pytest.mark.parametrize("name", MODELS)
def test_model_is_deterministic(name):
    docs = make_docs(per_label=4)
    texts, labels = [d.text for d in docs], [d.label for d in docs]
    params = {"min_freq": 1} if name == "pan18-baseline" else {}
    a = build_model(name, params).fit(texts, labels, seed=3).predict(texts)
    b = build_model(name, params).fit(texts, labels, seed=3).predict(texts)
    assert a == b


def test_fasttext_handles_arbitrary_label_strings():
    texts = ["alpha beta " * 5, "gamma delta " * 5] * 4
    labels = ["label with spaces", "__label__weird"] * 4
    model = build_model("fasttext").fit(texts, labels)
    assert set(model.predict(texts)) <= set(labels)


def test_unknown_model_is_rejected():
    with pytest.raises(KeyError, match="unknown model"):
        build_model("nope")
