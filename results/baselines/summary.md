| Dataset | Model | Splits | Accuracy | Macro-F1 | Fit time (s/split) |
|---|---|---|---|---|---|
| 7genre | char-ngram-svm | 30 | 97.2 ± 1.9 | 97.1 ± 1.9 | 32.1 |
| 7genre | fasttext | 30 | 91.1 ± 2.3 | 91.0 ± 2.4 | 42.6 |
| 7genre | pan18-baseline | 30 | 94.3 ± 2.3 | 94.3 ± 2.3 | 15.0 |
| ki04 | char-ngram-svm | 30 | 85.0 ± 2.9 | 85.0 ± 3.0 | 39.4 |
| ki04 | fasttext | 30 | 65.6 ± 4.1 | 65.6 ± 4.2 | 52.3 |
| ki04 | pan18-baseline | 30 | 75.9 ± 3.8 | 75.8 ± 4.0 | 35.0 |
| pan18 | char-ngram-svm | 20 | 67.8 ± 15.3 | 58.2 ± 12.7 | 1.5 |
| pan18 | fasttext | 20 | 21.7 ± 16.3 | 13.4 ± 10.3 | 3.2 |
| pan18 | pan18-baseline | 20 | 71.9 ± 12.0 | 58.4 ± 12.4 | 0.6 |

Macro-F1 by language (mean over problems):

| Dataset | Model | en | fr | it | pl | sp |
|---|---|---|---|---|---|---|
| pan18 | char-ngram-svm | 74.1 | 56.6 | 57.0 | 46.5 | 56.8 |
| pan18 | fasttext | 16.4 | 13.1 | 6.2 | 23.4 | 7.6 |
| pan18 | pan18-baseline | 69.7 | 58.5 | 60.5 | 41.9 | 61.5 |
