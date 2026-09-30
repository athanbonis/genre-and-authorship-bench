# Research plan

## Motivation

The 2019 undergraduate thesis *Text Categorization Based on Fine-tuning of Pre-trained Language
Models* (Bonis and Dimopoulos, University of the Aegean; see [`athanbonis/Thesis`](https://github.com/athanbonis/Thesis))
applied ULMFiT to web genre identification and authorship attribution. It reported large gains on
genre (99.1% on 7-genre, 92.6% on KI-04) and losses on authorship (below character n-gram
baselines, and no usable results outside English).

Reviewing it in 2026 found problems that make its numbers unreliable:

- test accuracy above validation accuracy on both genre corpora, consistent with the language
  model being fine-tuned on text that included each fold's test documents;
- inconsistent PAN-18 numbers, and accuracy reported where the official measure is macro-F1;
- an English-only pre-trained model applied to French, Italian, Polish and Spanish;
- comparisons against numbers copied from other papers instead of re-run under one protocol;
- most of the experiment code missing from the repository.

This project treats the thesis as motivation only. Everything is rebuilt, re-run and reported under
a single, leakage-free protocol.

## Research questions

1. **Authorship.** On cross-domain authorship attribution, do modern pretrained models (fine-tuned
   encoders, embeddings, LLMs) now beat character n-gram stylometry, and does this hold across
   languages?
2. **Genre.** On web genre identification, how large is the advantage of pretrained models once
   leakage is ruled out, and how much of it comes from content rather than form?
3. **Cost.** What does each point of accuracy cost in training time, inference time and money,
   from CPU baselines to LLM prompting?
4. **Robustness (stretch).** How do methods behave under less training data, topic shift and
   near-duplicate removal?

## Datasets

| Dataset | Task | Size | Protocol |
|---|---|---|---|
| 7-genre (Santini) | Web genre, 7 classes | 1,400 pages | Stratified 10-fold CV, 3 seeds |
| KI-04 (Meyer zu Eissen & Stein) | Web genre, 8 classes | 1,205 pages | Stratified 10-fold CV, 3 seeds |
| PAN-18 cross-domain authorship (dev) | Authorship, closed set, 5–20 candidates | 20 problems, 5 languages | Official known/unknown split per problem |

Candidates to add later: the PAN-18 evaluation corpus and newer PAN authorship tasks (including
AI-generated text), and a larger, more recent web genre corpus. See [datasets.md](datasets.md) for
provenance and terms of use.

## Evaluation protocol

These rules apply to every model and are enforced by the code where possible:

1. **Train-only learning.** Anything learned from text (vocabularies, scalers, embeddings,
   language-model adaptation, prompt examples) comes from the training part of each split only.
2. **No tuning on test data.** Hyperparameters are fixed in versioned configs. When tuning is
   needed, it uses validation data carved from the training split (nested CV).
3. **Metrics.** Accuracy and macro-F1 for every split. PAN-18 uses macro-F1 over the candidate
   authors, averaged over problems (the official measure), also reported per language.
4. **Variance.** Mean ± standard deviation over splits; three CV seeds for the genre corpora.
5. **Significance.** Paired comparisons between models over the same splits (Wilcoxon
   signed-rank test, with correction for multiple comparisons). *To be implemented.*
6. **Cost.** Fit and predict time per split, hardware, and API cost where relevant.
7. **Provenance.** Every run records the config, git commit and package versions.

## Methods roadmap

| Tier | Methods | Compute | Status |
|---|---|---|---|
| 0. Classical baselines | Official PAN-18 baseline (character 3-grams + SVM), TF-IDF character 1–4-gram SVM, fastText | CPU | Done |
| 1. Frozen embeddings | Sentence-embedding models (multilingual) + linear classifier | CPU, or free GPU | Next |
| 2. Fine-tuned encoders | e.g. ModernBERT (English), XLM-R / mDeBERTa (multilingual), with long-document handling | Free GPU (Kaggle / Colab) | Planned |
| 3. LLMs | Zero-shot and few-shot prompting; for PAN, known texts as in-context examples | API | Planned |
| 4. Historical reference | ULMFiT re-implemented under the leakage-free protocol | Free GPU | Optional |

GPU work runs in notebooks that clone this repository, run `gabench run <config>` and save
`results/`, so results stay reproducible and reviewable in pull requests.

## Known data issues to handle

- Exact duplicate texts: 5 in 7-genre and 12 in KI-04. Near-duplicates are likely too. Report
  results with and without de-duplication.
- 7-genre and KI-04 are text extracted from HTML and contain boilerplate such as CSS and
  navigation. Test the effect of cleaning.
- Documents are often longer than transformer context windows. Compare truncation, chunking
  with pooled predictions, and long-context models.

## Milestones

1. Classical baselines on all corpora, with CI and reproducible configs. *(done; the official
   PAN-18 baseline scores are reproduced exactly)*
2. Significance tests and a de-duplicated evaluation variant.
3. Frozen-embedding models.
4. Fine-tuned encoders on free GPUs.
5. LLM zero-shot and few-shot baselines, with cost accounting.
6. Analysis: error analysis, learning curves, cost–accuracy plots.
7. Paper draft and public release of code and results.

## Publication notes

- Possible venues: a CLEF/PAN workshop, an ACL-venue workshop, or an arXiv preprint first.
- Cite the 2019 thesis as prior work. Do not reuse its text, figures or numbers as new results.
- Check each dataset's terms before release (see [datasets.md](datasets.md)).
- Development is AI-assisted. Disclose this according to the target venue's policy. Authors
  remain responsible for all code, numbers and citations.
- Choose a licence before making the repository public.
