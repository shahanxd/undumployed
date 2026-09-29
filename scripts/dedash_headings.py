#!/usr/bin/env python3
"""Replace long dashes in markdown headings with colons and keep every link to them working.

Usage: python scripts/dedash_headings.py [--dry-run]

"### IIT Delhi — Summer Research Fellowship" becomes "### IIT Delhi: Summer Research Fellowship".
Because GitHub derives anchors from heading text, the anchor changes too
(#iit-delhi--summer-research-fellowship -> #iit-delhi-summer-research-fellowship), so every
same-file and cross-file link to it is rewritten. Link texts that mirror a changed heading are
updated the same way.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_links import slugify  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SKIP_PARTS = {".git", "site", "node_modules"}
HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*$")


def dedash(text: str) -> str:
    # "A — B" / "A — B — C" -> "A: B" / "A: B, C"; "A—B" (unspaced) -> "A: B"
    parts = [p.strip() for p in re.split(r"\s*—\s*", text) if p.strip()]
    if len(parts) <= 1:
        return text.replace("—", "").strip()
    return f"{parts[0]}: {', '.join(parts[1:])}"


def anchors(lines):
    """Map heading line index -> slug, with GitHub's -1, -2 suffixes for repeats."""
    seen, out, fence = {}, {}, False
    for i, line in enumerate(lines):
        if line.strip().startswith("```"):
            fence = not fence
            continue
        if fence:
            continue
        m = HEADING.match(line)
        if not m:
            continue
        base = slugify(m.group(2))
        n = seen.get(base, 0)
        seen[base] = n + 1
        out[i] = base if n == 0 else f"{base}-{n}"
    return out


def main():
    dry = "--dry-run" in sys.argv
    files = [p for p in ROOT.rglob("*.md") if not (set(p.parts) & SKIP_PARTS)]
    renames: dict[str, dict[str, str]] = {}   # rel path -> {old slug: new slug}
    text_renames: list[tuple[str, str]] = []   # (old heading text, new heading text)
    new_content: dict[Path, list[str]] = {}

    for path in files:
        lines = path.read_text(encoding="utf-8").split("\n")
        before = anchors(lines)
        changed = False
        for i in before:
            m = HEADING.match(lines[i])
            if "—" not in m.group(2):
                continue
            new_text = dedash(m.group(2))
            text_renames.append((m.group(2), new_text))
            lines[i] = f"{m.group(1)} {new_text}"
            changed = True
        if not changed:
            continue
        after = anchors(lines)
        rel = path.relative_to(ROOT).as_posix()
        renames[rel] = {before[i]: after[i] for i in before if before[i] != after[i]}
        new_content[path] = lines

    # rewrite links everywhere
    total_links = 0
    for path in files:
        lines = new_content.get(path) or path.read_text(encoding="utf-8").split("\n")
        rel = path.relative_to(ROOT).as_posix()
        text = "\n".join(lines)
        orig = text

        def fix(m):
            nonlocal total_links
            label, target = m.group(1), m.group(2)
            file_part, hash_, anchor = target.partition("#")
            if hash_:
                dest = rel if not file_part else (Path(rel).parent / file_part).as_posix()
                dest = str(Path(dest)).replace("\\", "/")
                # normalise ../ segments
                parts = []
                for seg in dest.split("/"):
                    if seg == "..":
                        parts.pop() if parts else None
                    elif seg and seg != ".":
                        parts.append(seg)
                dest = "/".join(parts)
                new_anchor = renames.get(dest, {}).get(anchor)
                if new_anchor:
                    total_links += 1
                    target = f"{file_part}#{new_anchor}"
            for old, new in text_renames:
                if label.strip() == old:
                    label = label.replace(old, new)
            return f"[{label}]({target})"

        text = re.sub(r"\[([^\]\n]*)\]\(([^)\s]+)\)", fix, text)
        if text != orig or path in new_content:
            if not dry:
                path.write_text(text, encoding="utf-8", newline="\n")
    n_head = len(text_renames)
    print(f"{n_head} headings changed in {len(new_content)} files; {total_links} links retargeted" + (" (dry run)" if dry else ""))
    for rel, m in renames.items():
        for a, b in list(m.items())[:2]:
            print(f"  {rel}: #{a} -> #{b}")


if __name__ == "__main__":
    main()
