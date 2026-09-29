#!/usr/bin/env python3
"""Stamp every CSS and JS reference with a version, at deploy time.

Usage: python scripts/stamp_version.py <site_dir> <version>

Some hosts (GitHub Pages, for one) let browsers cache files for ten minutes. Without versions, someone who visited just
before a deploy could get a fresh app.js alongside a cached older module and end up with a broken
page. After stamping, each deploy's files have their own URLs (app.js?v=abc123), so a page only ever
loads files from one release. Run it in CI on the copy being deployed; the repo stays unstamped.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


def stamp(site: Path, version: str) -> tuple[int, int]:
    v = re.sub(r"[^A-Za-z0-9._-]", "", version)[:40] or "dev"
    html = site / "index.html"
    text = html.read_text(encoding="utf-8")
    # href="css/x.css", src="js/app.js", href="js/state.js", href="manifest.webmanifest"
    text, n_html = re.subn(r'((?:href|src)=")((?:css|js)/[^"?#]+\.(?:css|js)|manifest\.webmanifest)(")', rf"\1\2?v={v}\3", text)
    html.write_text(text, encoding="utf-8", newline="\n")
    n_js = 0
    for js in (site / "js").rglob("*.js"):
        if "vendor" in js.parts:
            continue
        src = js.read_text(encoding="utf-8")
        # static imports: from './x.js'   dynamic: import('./x.js')
        out, k = re.subn(r"""((?:from\s+|import\s*\(\s*)['"])(\.{1,2}/[^'"?#]+\.js)(['"])""", rf"\1\2?v={v}\3", src)
        if k:
            js.write_text(out, encoding="utf-8", newline="\n")
            n_js += k
    return n_html, n_js


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    a, b = stamp(Path(sys.argv[1]), sys.argv[2])
    print(f"stamped {a} references in index.html and {b} imports in js/")
