"""Checks for the static explainer site in site/."""

import base64
import hashlib
import json
import re
from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / "site"


def test_csp_allows_the_inline_script():
    """The CSP pins the inline theme script by hash; editing the script requires a new hash."""
    html = (SITE / "index.html").read_text(encoding="utf-8")
    scripts = re.findall(r"<script>(.*?)</script>", html, re.S)
    config = json.loads((SITE / "staticwebapp.config.json").read_text(encoding="utf-8"))
    csp = config["globalHeaders"]["Content-Security-Policy"]
    for script in scripts:
        digest = base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
        assert f"'sha256-{digest}'" in csp


def test_referenced_assets_exist():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    for ref in re.findall(r'(?:href|src)="([^"#:]+)"', html):
        assert (SITE / ref).is_file(), ref
