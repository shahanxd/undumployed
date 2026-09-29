#!/usr/bin/env python3
"""Two small tools for a careful prose pass over the markdown.

  python scripts/humanize_lines.py extract out.json [--chunk 60]
      Collect every line that has a long dash (—), a spaced en dash ( – ), or a stock phrase that
      reads as machine-written. Headings, code, tag lines and generated files are left out.

  python scripts/humanize_lines.py apply edits.json [--dry-run]
      edits.json: [{"file": "...", "edits": [{"n": 12, "text": "new line", "old": "line as extracted"}]}]
      With "old", an edit follows its line if other edits moved it, and is skipped if the line itself changed.
      Each proposed line is checked before it is written: no long dashes, every URL, number,
      link, bold mark, status emoji, code span and table cell still there, no negation dropped,
      same list/table/quote prefix. Anything that fails is kept as it was and reported.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_PARTS = {".git", "site", "node_modules"}
GENERATED = {"deadlines.md"}
TELLS = re.compile(r"\b(genuinely|the single most|it'?s not just|here'?s the thing|in short|navigat(?:e|ing) the|leverag(?:e|ing)|unlock(?:s|ing)? (?:your|the)|robust|seamless(?:ly)?|crucial(?:ly)?|delve|game[- ]changer|a testament|boasts?|vibrant|in today'?s)\b", re.I)
URL = re.compile(r"https?://[^\s)>\]]+")
NUM = re.compile(r"\d+(?:[.,]\d+)*")
NEG = re.compile(r"\b(not|no|never|none|without|cannot|can't|don't|doesn't|won't|isn't|aren't|wasn't|n't)\b", re.I)
PREFIX = re.compile(r"^(\s*(?:[-*+]\s+|\d+\.\s+|>\s*|\|))")


def candidate_lines(path: Path):
    lines = path.read_text(encoding="utf-8").split("\n")
    fence = False
    in_generated = False
    for i, line in enumerate(lines, 1):
        s = line.strip()
        if s.startswith("```"):
            fence = not fence
            continue
        if "events-calendar:start" in s:
            in_generated = True
        if "events-calendar:end" in s:
            in_generated = False
            continue
        if fence or in_generated or s.startswith("#") or s.startswith("<!--"):
            continue
        if "—" in line or " – " in line or TELLS.search(line):
            yield i, line


def cmd_extract(out: str, chunk: int):
    files = sorted(p for p in ROOT.rglob("*.md") if not (set(p.parts) & SKIP_PARTS) and p.name not in GENERATED)
    chunks = []
    total = 0
    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        rows = [{"n": n, "text": t} for n, t in candidate_lines(path)]
        total += len(rows)
        for k in range(0, len(rows), chunk):
            chunks.append({"file": rel, "part": k // chunk + 1, "parts": (len(rows) + chunk - 1) // chunk, "lines": rows[k:k + chunk]})
    Path(out).write_text(json.dumps(chunks, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{total} lines in {len(chunks)} chunks from {len({c['file'] for c in chunks})} files -> {out}")


def cells(line: str) -> int:
    # count table pipes outside links and code
    depth = 0; code = False; n = 0
    for ch in line:
        if ch == "`": code = not code
        elif not code and ch == "[": depth += 1
        elif not code and ch == "]": depth = max(0, depth - 1)
        elif not code and depth == 0 and ch == "|": n += 1
    return n


def problems(old: str, new: str) -> list[str]:
    bad = []
    if "—" in new: bad.append("still has a long dash")
    if " – " in new: bad.append("still has a spaced en dash")
    for u in URL.findall(old):
        if u.rstrip(".,;:") not in new: bad.append(f"lost url {u}")
    lost = Counter(NUM.findall(old)) - Counter(NUM.findall(new))
    if lost: bad.append(f"lost numbers {dict(lost)}")
    for mark in ("](", "**", "`", "✅", "❌", "⚠️", "~"):
        if old.count(mark) != new.count(mark) and not (mark == "~" and new.count(mark) > old.count(mark)):
            bad.append(f"'{mark}' count {old.count(mark)} -> {new.count(mark)}")
    if old.lstrip().startswith("|") and cells(old) != cells(new): bad.append(f"table cells {cells(old)} -> {cells(new)}")
    if len(NEG.findall(new)) < len(NEG.findall(old)): bad.append("dropped a negation")
    po, pn = PREFIX.match(old), PREFIX.match(new)
    if (po.group(1) if po else "") != (pn.group(1) if pn else ""): bad.append("changed the line prefix")
    if len(new) > len(old) * 1.4 + 24: bad.append("much longer")
    if not new.strip(): bad.append("empty")
    return bad


def cmd_apply(src: str, dry: bool):
    data = json.loads(Path(src).read_text(encoding="utf-8"))
    by_file: dict[str, list] = {}
    for block in data:
        by_file.setdefault(block["file"], []).extend(block.get("edits", []))
    applied = rejected = 0
    report = []
    for rel, edits in sorted(by_file.items()):
        path = ROOT / rel
        lines = path.read_text(encoding="utf-8").split("\n")
        for e in edits:
            n, new = int(e["n"]), e["text"].rstrip("\n")
            if not (1 <= n <= len(lines)) and "old" not in e:
                rejected += 1; report.append(f"{rel}:{n} line out of range"); continue
            if "old" in e and (not (1 <= n <= len(lines)) or lines[n - 1] != e["old"]):
                # the file moved on since the extract: follow the line if its text is still there exactly once
                hits = [i for i, l in enumerate(lines) if l == e["old"]]
                if len(hits) != 1:
                    rejected += 1; report.append(f"{rel}:{n} kept as is (the line changed after it was extracted)"); continue
                n = hits[0] + 1
            old = lines[n - 1]
            if old == new:
                continue
            bad = problems(old, new)
            if bad:
                rejected += 1; report.append(f"{rel}:{n} kept as is ({'; '.join(bad)})")
                continue
            lines[n - 1] = new
            applied += 1
        if not dry:
            path.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"applied {applied}, kept {rejected} as they were" + (" (dry run)" if dry else ""))
    for r in report[:400]:
        print("  " + r)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    if sys.argv[1] == "extract":
        size = int(sys.argv[sys.argv.index("--chunk") + 1]) if "--chunk" in sys.argv else 60
        cmd_extract(sys.argv[2], size)
    elif sys.argv[1] == "apply":
        cmd_apply(sys.argv[2], "--dry-run" in sys.argv)
    else:
        sys.exit(__doc__)
