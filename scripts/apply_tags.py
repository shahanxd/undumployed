#!/usr/bin/env python3
"""Insert or update the facet tag line under each entry heading from a tags JSON file.

Usage: python scripts/apply_tags.py tags.json

tags.json: [{"file": "internships/research-india.md", "tags": [{"heading": "...", "stage": [...], "field": [...],
             "region": "...", "funding": "...", "citizenship": "...", "gates": [...], "format": "..."}, ...]}, ...]

The tag line is an HTML comment right after the "### heading" line, invisible on GitHub:
  <!-- tags: stage=ug,pg; field=cs,ai; region=europe; funding=stipend; citizenship=any; gates=faculty-first; format=in-person -->
Existing tag lines are replaced. Headings are matched exactly, then case/space-insensitively as a fallback.
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAG_RE = re.compile(r"^<!--\s*tags:.*?-->\s*$")


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", html.unescape(s).lower())


def tag_line(t: dict) -> str:
    parts = [
        f"stage={','.join(t.get('stage') or [])}",
        f"field={','.join(t.get('field') or [])}",
        f"region={t.get('region') or ''}",
        f"funding={t.get('funding') or ''}",
        f"citizenship={t.get('citizenship') or 'any'}",
        f"gates={','.join(t.get('gates') or [])}",
        f"format={t.get('format') or ''}",
    ]
    return f"<!-- tags: {'; '.join(parts)} -->"


def apply(rel: str, tags: list[dict], dry: bool = False) -> tuple[int, list[str]]:
    path = ROOT / rel
    lines = path.read_text(encoding="utf-8").splitlines()
    by_exact = {html.unescape(t["heading"]).strip(): t for t in tags}
    by_norm = {norm(t["heading"]): t for t in tags}
    out, applied, missing = [], 0, []
    used = set()
    i = 0
    while i < len(lines):
        line = lines[i]
        out.append(line)
        if line.startswith("### "):
            heading = line[4:].strip()
            t = by_exact.get(heading) or by_norm.get(norm(heading))
            # drop an existing tag line
            if i + 1 < len(lines) and TAG_RE.match(lines[i + 1].strip()):
                i += 1
            if t:
                out.append(tag_line(t))
                applied += 1
                used.add(id(t))
            else:
                missing.append(heading)
        i += 1
    if not dry:
        path.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    unused = [t["heading"] for t in tags if id(t) not in used]
    return applied, missing + [f"(unused tag) {u}" for u in unused]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    dry = "--dry-run" in sys.argv
    total = 0
    for block in data:
        applied, problems = apply(block["file"], block["tags"], dry)
        total += applied
        print(f"{block['file']}: {applied} tagged" + (f"; {len(problems)} issues: {problems[:6]}" if problems else ""))
    print(f"{total} entries tagged" + (" (dry run, nothing written)" if dry else ""))


if __name__ == "__main__":
    main()
