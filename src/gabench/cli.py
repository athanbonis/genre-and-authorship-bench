"""Command-line interface: ``gabench fetch``, ``gabench run`` and ``gabench report``."""

from __future__ import annotations

import argparse
from pathlib import Path

from gabench.data.fetch import THESIS_REPO, fetch_thesis_corpora
from gabench.experiment import load_config, run_experiment, write_summary


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="gabench", description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    fetch = sub.add_parser("fetch", help="download the raw corpora into data/raw")
    fetch.add_argument("--source", default=THESIS_REPO, help="git URL or local checkout")
    fetch.add_argument("--force", action="store_true", help="re-download even if present")

    run = sub.add_parser("run", help="run an experiment config")
    run.add_argument("config", type=Path)
    run.add_argument("--out", type=Path, default=Path("results"))
    run.add_argument("--datasets", nargs="+", help="only these datasets")
    run.add_argument("--models", nargs="+", help="only these models")
    run.add_argument("--jobs", type=int, default=1, help="parallel processes")

    report = sub.add_parser("report", help="rebuild summary tables from runs.jsonl")
    report.add_argument("config", type=Path)
    report.add_argument("--out", type=Path, default=Path("results"))

    args = parser.parse_args(argv)
    if args.command == "fetch":
        print(f"corpora available in {fetch_thesis_corpora(args.source, args.force)}")
    elif args.command == "run":
        out = run_experiment(
            load_config(args.config), args.out, args.datasets, args.models, args.jobs
        )
        print((out / "summary.md").read_text())
    else:
        config = load_config(args.config)
        write_summary(args.out / config["experiment"], config)


if __name__ == "__main__":
    main()
