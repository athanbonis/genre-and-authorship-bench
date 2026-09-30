"""Run an experiment described by a YAML config."""

from __future__ import annotations

import json
import platform
import subprocess
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from importlib import metadata
from pathlib import Path
from typing import Any

import yaml

from gabench.data import Split, load_splits
from gabench.evaluation.metrics import score
from gabench.evaluation.report import summarize, to_markdown
from gabench.models import build_model


def load_config(path: Path) -> dict[str, Any]:
    return yaml.safe_load(path.read_text())


def run_experiment(
    config: dict[str, Any],
    out_dir: Path,
    datasets: list[str] | None = None,
    models: list[str] | None = None,
    jobs: int = 1,
) -> Path:
    """Run every (dataset split, model) pair and write per-split results and a summary.

    With ``jobs > 1`` the pairs run in parallel processes. Each model is single-threaded
    and seeded, so results do not depend on ``jobs``.
    """
    out = out_dir / config["experiment"]
    out.mkdir(parents=True, exist_ok=True)
    runs_path = out / "runs.jsonl"
    runs_path.unlink(missing_ok=True)

    tasks = [
        (split, model_name, params)
        for dataset, protocol in config["datasets"].items()
        if not datasets or dataset in datasets
        for split in load_splits(dataset, protocol)
        for model_name, params in config["models"].items()
        if not models or model_name in models
    ]
    if jobs > 1:
        with ProcessPoolExecutor(max_workers=jobs) as pool:
            futures = [pool.submit(_run_one, *t) for t in tasks]
            records = [_log(f.result()) for f in as_completed(futures)]
    else:
        records = [_log(_run_one(*t)) for t in tasks]

    order = {(t[0].dataset, t[0].split_id, t[1]): i for i, t in enumerate(tasks)}
    records.sort(key=lambda r: order[(r["dataset"], r["split_id"], r["model"])])
    runs_path.write_text("".join(json.dumps(r) + "\n" for r in records))
    write_summary(out, config)
    return out


def _run_one(split: Split, model_name: str, params: dict[str, Any] | None) -> dict[str, Any]:
    train_texts = [d.text for d in split.train]
    test_texts = [d.text for d in split.test]
    model = build_model(model_name, params)
    t0 = time.perf_counter()
    model.fit(train_texts, [d.label for d in split.train], seed=split.seed)
    t1 = time.perf_counter()
    predictions = model.predict(test_texts)
    t2 = time.perf_counter()
    return {
        "dataset": split.dataset,
        "split_id": split.split_id,
        "seed": split.seed,
        "language": split.language,
        "model": model_name,
        "n_train": len(train_texts),
        "n_test": len(test_texts),
        **score([d.label for d in split.test], predictions, split.label_set),
        "fit_seconds": t1 - t0,
        "predict_seconds": t2 - t1,
    }


def _log(record: dict[str, Any]) -> dict[str, Any]:
    print(
        f"{record['dataset']:7} {record['split_id']:14} {record['model']:15} "
        f"acc={record['accuracy']:.3f} f1={record['macro_f1']:.3f}",
        flush=True,
    )
    return record


def write_summary(out: Path, config: dict[str, Any]) -> None:
    from gabench.evaluation.report import read_runs

    rows = summarize(read_runs(out / "runs.jsonl"))
    (out / "summary.json").write_text(json.dumps(rows, indent=2) + "\n")
    (out / "summary.md").write_text(to_markdown(rows))
    (out / "environment.json").write_text(json.dumps(_environment(config), indent=2) + "\n")


def _environment(config: dict[str, Any]) -> dict[str, Any]:
    packages = ["genre-and-authorship-bench", "numpy", "scikit-learn", "scipy", "fasttext-wheel"]
    try:
        commit = subprocess.run(
            ["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        commit = None
    return {
        "config": config,
        "git_commit": commit,
        "python": platform.python_version(),
        "platform": platform.platform(),
        "packages": {p: metadata.version(p) for p in packages},
    }
