#!/usr/bin/env python3
"""Check every relative markdown link and #anchor in the repo resolves.

Usage: python scripts/check_links.py        (exit 1 on any broken link)

External (http) links are left to the lychee GitHub Action.
"""
from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")


def slugify(text: str) -> str:
    """GitHub-style heading slug."""
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)  # link text only
    text = text.strip().lower()
    out = []
    for ch in text:
        if ch == " ":
            out.append("-")
        elif ch == "-" or ch == "_":
            out.append(ch)
        elif unicodedata.category(ch)[0] in ("L", "N") or unicodedata.category(ch) == "Mn":
            out.append(ch)
        # everything else (punctuation, emoji, symbols) is dropped
    return "".join(out)


def anchors_for(path: Path, cache: dict) -> set[str]:
    if path in cache:
        return cache[path]
    seen: dict[str, int] = {}
    anchors = set()
    in_code = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        m = HEADING_RE.match(line)
        if not m:
            continue
        slug = slugify(m.group(2))
        n = seen.get(slug, 0)
        seen[slug] = n + 1
        anchors.add(slug if n == 0 else f"{slug}-{n}")
    cache[path] = anchors
    return anchors


def main() -> int:
    cache: dict = {}
    broken = []
    # site/data holds copies of the guides for the website; their relative links are rewritten at runtime
    files = [p for p in ROOT.rglob("*.md") if ".git" not in p.parts and "site" not in p.parts and "node_modules" not in p.parts]
    for md in files:
        # drop fenced code blocks and inline code (examples in CONTRIBUTING.md contain placeholder links)
        text = re.sub(r"```.*?```", "", md.read_text(encoding="utf-8"), flags=re.S)
        text = re.sub(r"`[^`\n]*`", "", text)
        for target in LINK_RE.findall(text):
            if target.startswith(("http://", "https://", "mailto:")):
                continue
            target = target.split("?")[0]
            file_part, _, anchor = target.partition("#")
            if file_part:
                dest = (md.parent / file_part).resolve()
                if not dest.exists():
                    broken.append((md, target, "missing file"))
                    continue
            else:
                dest = md
            if anchor and dest.suffix == ".md":
                if anchor.lower() not in anchors_for(dest, cache):
                    broken.append((md, target, "missing anchor"))
    for md, target, why in broken:
        print(f"{md.relative_to(ROOT)}: {target}  ({why})")
    print(f"{len(files)} files scanned, {len(broken)} broken links")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
