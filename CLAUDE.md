# Notes for Claude Code

## Commits and pull requests

- Never include Claude session links (`Claude-Session:` trailers or `claude.ai/code/session_…`
  URLs) in commit messages, PR titles or PR descriptions. Keep the `Co-Authored-By: Claude …`
  trailer so AI assistance stays visible.
- Work on a branch and open a pull request. Don't push to `main` directly.
- Squash-merge pull requests.

## Development

- Environment: `uv sync`. Run everything through `uv run`.
- Before pushing, run the same checks as CI:
  `uv run ruff check . && uv run ruff format --check . && uv run pytest -q`.
- Data: `uv run gabench fetch` downloads the corpora into `data/` (git-ignored). Never commit
  raw data.
- Experiments: configs live in `configs/`, and results are committed under `results/`. Rules:
  - fit models on training data only;
  - never tune on test data;
  - record every run with its config and commit (`gabench run` does this).
- Evaluation rules are in `docs/research-plan.md`. Follow them for every new model.

## Explainer site

- `site/` is plain HTML/CSS/JS with no build step. It deploys to Azure Static Web Apps from `main`.
- The CSP in `site/staticwebapp.config.json` pins the inline script by hash. If you edit that
  script, update the hash (`tests/test_site.py` checks it).
- The results shown on the site are written into `site/app.js` by hand. Update them when
  `results/` changes.
