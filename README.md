# genre-and-authorship-bench

A reproducible benchmark of text classification methods, from character n-gram stylometry to
fine-tuned encoders and LLMs, on two tasks where *how* a text is written matters as much as
*what* it says:

- **Web genre identification:** is this page a blog, a shop, an FAQ, a front page…?
- **Authorship attribution:** which candidate wrote this text, when the known and unknown texts
  come from different domains?

The questions, protocol and roadmap are in [`docs/research-plan.md`](docs/research-plan.md).

## Status

Early development. Classical CPU baselines run on all corpora. Pretrained models are next.

## Results

Classical baselines (`configs/baselines.yaml`), CPU only. Mean ± standard deviation over splits:
30 for the genre corpora (10 folds × 3 seeds), 20 problems for PAN-18. Full tables:
[`results/baselines/summary.md`](results/baselines/summary.md).

| Model | 7-genre accuracy | KI-04 accuracy | PAN-18 macro-F1 |
|---|---|---|---|
| `pan18-baseline` | 94.3 ± 2.3 | 75.9 ± 3.8 | **58.4** ± 12.4 |
| `char-ngram-svm` | **97.2** ± 1.9 | **85.0** ± 2.9 | 58.2 ± 12.7 |
| `fasttext` | 91.1 ± 2.3 | 65.6 ± 4.1 | 13.4 ± 10.3 |

PAN-18 macro-F1 by language:

| Model | EN | FR | IT | PL | ES |
|---|---|---|---|---|---|
| `pan18-baseline` | 69.7 | 58.5 | 60.5 | 41.9 | 61.5 |
| `char-ngram-svm` | 74.1 | 56.6 | 57.0 | 46.5 | 56.8 |
| `fasttext` | 16.4 | 13.1 | 6.2 | 23.4 | 7.6 |

Observations so far:

- `pan18-baseline` reproduces the official PAN-18 baseline scores (58.4 overall, 69.7 EN,
  58.5 FR, 60.5 IT, 41.9 PL, 61.5 ES), which validates the data loading and the metric.
- A plain character n-gram SVM already matches or beats the best earlier genre results cited
  in the 2019 thesis (96.5% on 7-genre and 84.1% on KI-04, Kanaris and Stamatatos, 2009). It is the bar that pretrained models have to clear.
- fastText trained from scratch does poorly with only 7 known texts per author. Authorship with
  this little data needs stylometric features or pretrained knowledge.

## Quick start

Requires [uv](https://docs.astral.sh/uv/) and git.

```bash
uv sync                                               # create the environment
uv run gabench fetch                                  # download the corpora into data/raw
uv run gabench run configs/baselines.yaml --jobs 4    # run all baselines
```

Each run writes `results/<experiment>/`:

| File | Contents |
|---|---|
| `runs.jsonl` | One record per (split, model): metrics and timings |
| `summary.md`, `summary.json` | Mean ± std per dataset and model, plus PAN-18 per-language scores |
| `environment.json` | Config, git commit, Python and package versions |

Use `--datasets` and `--models` to run a subset. Use `gabench report <config>` to rebuild the
summaries from `runs.jsonl`.

## Evaluation protocol

- Models learn only from the training part of each split. No vocabulary, scaling, embedding or
  fine-tuning step sees test documents.
- Hyperparameters are fixed in versioned configs (`configs/`), never tuned on test data.
- Genre corpora: stratified 10-fold cross-validation, repeated with 3 seeds.
- PAN-18: the official known/unknown split per problem. The official measure is macro-F1 over
  the candidate authors, averaged over the 20 problems.
- Runs are seeded and single-threaded per model, so results do not depend on `--jobs`.

## Datasets

| Dataset | Task | Size |
|---|---|---|
| 7-genre (Santini) | 7 web genres | 1,400 pages |
| KI-04 (Meyer zu Eissen & Stein, 2004) | 8 web genres | 1,205 pages |
| PAN-18 cross-domain authorship attribution, development corpus | 5–20 candidate authors per problem | 20 problems in EN, FR, IT, PL, ES |

Provenance and terms of use: [`docs/datasets.md`](docs/datasets.md).

## Models

| Name | Description |
|---|---|
| `pan18-baseline` | Official PAN-18 baseline: character 3-grams, length-normalised, one-vs-rest linear SVM. It reproduces all 1,315 stored answers of the official implementation. |
| `char-ngram-svm` | TF-IDF (sublinear) over character 1–4-grams, linear SVM |
| `fasttext` | fastText supervised classifier with word uni- and bigrams, trained from scratch |

## Repository layout

```
configs/            experiment configs
docs/               research plan and dataset notes
results/            committed results (runs, summaries, environment)
src/gabench/
  data/             corpus loaders, evaluation protocols, fetching
  models/           classifiers behind a common fit/predict interface
  evaluation/       metrics and summary tables
  experiment.py     experiment runner
  cli.py            the `gabench` command
tests/              unit and end-to-end tests on synthetic data
```

## Development

```bash
uv run pytest
uv run ruff check . && uv run ruff format --check .
```

CI runs the same checks on every push and pull request.

## Background

This project is a from-scratch rebuild of the questions studied in:

> A. Bonis and G. Dimopoulos. *Text Categorization Based on Fine-tuning of Pre-trained Language
> Models.* Undergraduate thesis, University of the Aegean, 2019.
> [Repository](https://github.com/athanbonis/Thesis) ·
> [Hellanicus](https://hellanicus.lib.aegean.gr/items/f79c6c6c-fcf2-4985-b396-8a1117c06b4b)

None of the thesis code or results are reused. See the research plan for why its numbers are
treated as unreliable.
