# Datasets

`gabench fetch` downloads all corpora into `data/raw/` (not committed). For now they come from
the archived thesis repository [`athanbonis/Thesis`](https://github.com/athanbonis/Thesis), where
they are stored unchanged. Each loader checks the expected number of documents.

The corpora belong to their creators. Their terms of use have not yet been verified. Do that
before any public release, and prefer downloading from the original sources.

## 7-genre

- **Creator:** Marina Santini.
- **Content:** 1,400 English web pages, 200 per genre: blog, e-shop, FAQ, front page, listing,
  personal home page (`PHP`) and search page (`SPAGE`).
- **Format:** plain text extracted from HTML, Latin-1. One directory per genre.
- **Loader:** `gabench.data.genre.load_7genre`. The label is the directory name.

## KI-04

- **Creators:** Sven Meyer zu Eissen and Benno Stein, *Genre Classification of Web Pages*,
  KI 2004.
- **Content:** 1,205 English web pages in 8 genres: article, discussion, download, help, link
  list, non-private portrait, private portrait and shop. Class sizes range from 126 to 205.
- **Format:** plain text extracted from HTML, Latin-1. The genre is the file-name prefix, e.g.
  `portrait-non_priv_5262883583.TXT`.
- **Loader:** `gabench.data.genre.load_ki04`.

## PAN-18 cross-domain authorship attribution

- **Source:** PAN at CLEF 2018. Kestemont et al., *Overview of the Author Identification Task at
  PAN-2018: Cross-domain Authorship Attribution and Style Change Detection*.
- **Content:** development corpus of 20 closed-set problems (4 each in English, French, Italian,
  Polish and Spanish) built from fanfiction. Each problem has 5–20 candidate authors with 7
  "known" texts each from one fandom, and "unknown" texts from other fandoms. The ground truth is
  included.
- **Protocol:** the official known/unknown split per problem. The measure is macro-F1 over the
  candidate authors, averaged over problems.
- **Loader:** `gabench.data.pan18.load_pan18`.
- **Check:** the `pan18-baseline` model reproduces all 1,315 answers of the official baseline
  that are stored in the thesis repository.
