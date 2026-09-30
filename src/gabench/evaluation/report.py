"""Aggregate per-split results into summary tables."""

from __future__ import annotations

import json
import statistics
from collections import defaultdict
from pathlib import Path
from typing import Any


def read_runs(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def summarize(runs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One row per (dataset, model): mean and standard deviation over splits.

    For PAN-18 the splits are the 20 problems, so the mean is the official
    "average macro-F1 over problems"; per-language means are added as extra columns.
    """
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for r in runs:
        groups[(r["dataset"], r["model"])].append(r)

    rows = []
    for (dataset, model), rs in sorted(groups.items()):
        row: dict[str, Any] = {"dataset": dataset, "model": model, "splits": len(rs)}
        for metric in ("accuracy", "macro_f1"):
            values = [r[metric] for r in rs]
            row[metric] = statistics.fmean(values)
            row[f"{metric}_std"] = statistics.stdev(values) if len(values) > 1 else 0.0
        row["fit_seconds"] = statistics.fmean(r["fit_seconds"] for r in rs)
        by_language: dict[str, list[float]] = defaultdict(list)
        for r in rs:
            by_language[r["language"]].append(r["macro_f1"])
        if len(by_language) > 1:
            row["macro_f1_by_language"] = {
                lang: statistics.fmean(v) for lang, v in sorted(by_language.items())
            }
        rows.append(row)
    return rows


def to_markdown(rows: list[dict[str, Any]]) -> str:
    lines = [
        "| Dataset | Model | Splits | Accuracy | Macro-F1 | Fit time (s/split) |",
        "|---|---|---|---|---|---|",
    ]
    for r in rows:
        lines.append(
            f"| {r['dataset']} | {r['model']} | {r['splits']} "
            f"| {_pct(r['accuracy'], r['accuracy_std'])} "
            f"| {_pct(r['macro_f1'], r['macro_f1_std'])} | {r['fit_seconds']:.1f} |"
        )

    multilingual = [r for r in rows if "macro_f1_by_language" in r]
    if multilingual:
        languages = sorted(multilingual[0]["macro_f1_by_language"])
        lines += [
            "",
            "Macro-F1 by language (mean over problems):",
            "",
            "| Dataset | Model | " + " | ".join(languages) + " |",
            "|---|---|" + "---|" * len(languages),
        ]
        for r in multilingual:
            cells = " | ".join(f"{100 * r['macro_f1_by_language'][lang]:.1f}" for lang in languages)
            lines.append(f"| {r['dataset']} | {r['model']} | {cells} |")
    return "\n".join(lines) + "\n"


def _pct(mean: float, std: float) -> str:
    return f"{100 * mean:.1f} ± {100 * std:.1f}"
