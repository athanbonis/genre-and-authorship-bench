import json

import pytest
import yaml

from gabench.data import pan18
from gabench.evaluation.metrics import score
from gabench.evaluation.report import summarize, to_markdown
from gabench.experiment import run_experiment


def test_macro_f1_counts_never_predicted_candidates():
    result = score(["a", "a"], ["a", "a"], labels=["a", "b"])
    assert result["accuracy"] == 1.0
    assert result["macro_f1"] == pytest.approx(0.5)


def test_summary_reports_mean_std_and_languages():
    runs = [
        {
            "dataset": "d",
            "model": "m",
            "language": lang,
            "accuracy": a,
            "macro_f1": a,
            "fit_seconds": 1.0,
        }
        for lang, a in [("en", 0.5), ("fr", 1.0)]
    ]
    [row] = summarize(runs)
    assert row["accuracy"] == pytest.approx(0.75)
    assert row["macro_f1_by_language"] == {"en": 0.5, "fr": 1.0}
    assert "75.0 ±" in to_markdown([row])


def test_end_to_end_on_pan18_layout(pan18_root, tmp_path, monkeypatch):
    data = tmp_path / "data"
    target = data / "raw" / "thesis-2019" / "pan18" / "datasets"
    target.parent.mkdir(parents=True)
    pan18_root.rename(target)
    monkeypatch.setenv("GABENCH_DATA", str(data))
    monkeypatch.setattr(pan18, "N_PROBLEMS", 2)

    config = yaml.safe_load(
        "experiment: smoke\n"
        "datasets: {pan18: {type: official}}\n"
        "models: {char-ngram-svm: {min_df: 1}}\n"
    )
    out = run_experiment(config, tmp_path / "results")
    runs = [json.loads(line) for line in (out / "runs.jsonl").read_text().splitlines()]
    assert len(runs) == 2
    assert all(r["macro_f1"] == 1.0 for r in runs)
    assert (out / "summary.md").exists()


def test_parallel_run_matches_serial(pan18_root, tmp_path, monkeypatch):
    data = tmp_path / "data"
    target = data / "raw" / "thesis-2019" / "pan18" / "datasets"
    target.parent.mkdir(parents=True)
    pan18_root.rename(target)
    monkeypatch.setenv("GABENCH_DATA", str(data))
    monkeypatch.setattr(pan18, "N_PROBLEMS", 2)
    config = yaml.safe_load(
        "experiment: smoke\n"
        "datasets: {pan18: {type: official}}\n"
        "models: {char-ngram-svm: {min_df: 1}, pan18-baseline: {min_freq: 1}}\n"
    )

    def results(jobs):
        out = run_experiment(config, tmp_path / f"results{jobs}", jobs=jobs)
        runs = [json.loads(line) for line in (out / "runs.jsonl").read_text().splitlines()]
        return [(r["split_id"], r["model"], r["macro_f1"]) for r in runs]

    assert results(1) == results(2)
