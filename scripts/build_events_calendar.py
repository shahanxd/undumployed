#!/usr/bin/env python3
"""Regenerate the chronological table in events/README.md from the four events files.

Usage: python scripts/build_events_calendar.py

Reads the "At a glance" table of each events file (columns: Event | Dates |
Location | Access | Student angle), sorts rows by the first month/year found in
the Dates cell, and rewrites the block between the two marker comments in
events/README.md. Rows whose date can't be parsed go to the end.
"""
from __future__ import annotations

import datetime as dt
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / "events" / "README.md"
FILES = [
    ("tech-global.md", "Tech"),
    ("research-conferences.md", "Research"),
    ("india.md", "India"),
    ("arts-culture.md", "Arts / culture"),
]
MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}
ROW_RE = re.compile(r"^\|\s*\[(?P<name>[^\]]+)\]\(#(?P<anchor>[^)]+)\)\s*\|(?P<rest>.*)\|\s*$")
DATE_RE = re.compile(r"([A-Z][a-z]{2,8})\.?(?:\s+(\d{1,2}))?(?:\s*[–-]\s*(?:[A-Z][a-z]{2,8}\.?\s+)?\d{1,2})?,?\s+(\d{4})")
START = "<!-- events-calendar:start -->"
END = "<!-- events-calendar:end -->"


def first_date(cell: str) -> dt.date | None:
    m = DATE_RE.search(cell.replace("**", ""))
    if not m:
        return None
    mon, day, year = m.groups()
    mi = MONTHS.get(mon[:3].lower())
    if not mi:
        return None
    try:
        return dt.date(int(year), mi, int(day) if day else 1)
    except ValueError:
        return dt.date(int(year), mi, 1)


def rows():
    out = []
    for fname, label in FILES:
        text = (ROOT / "events" / fname).read_text(encoding="utf-8")
        idx = text.find("## At a glance")
        if idx < 0:
            continue
        for line in text[idx:].splitlines()[1:]:
            if line.startswith("## ") or (line.strip() == "" and out and out[-1][0] == fname and False):
                pass
            if line.startswith("## "):
                break
            m = ROW_RE.match(line)
            if not m:
                continue
            cells = [c.strip() for c in m.group("rest").split("|")]
            if len(cells) < 4:
                continue
            dates, location, access, student = cells[0], cells[1], cells[2], cells[3]
            out.append((first_date(dates), m.group("name"), f"{fname}#{m.group('anchor')}",
                        dates, location, label, student))
    out.sort(key=lambda r: (r[0] or dt.date(2999, 1, 1), r[1]))
    return out


def clean(s: str, n: int) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def main():
    lines = ["| When | Event | Where | Type | Student angle |", "|------|-------|-------|------|---------------|"]
    cur = None
    for d, name, link, dates, loc, label, student in rows():
        key = d.strftime("%B %Y") if d else "Date TBA"
        if key != cur:
            cur = key
            lines.append(f"| **{key}** | | | | |")
        lines.append(f"| {clean(dates, 34)} | [{clean(name, 48)}]({link}) | {clean(loc, 28)} | {label} | {clean(student, 44)} |")
    block = "\n".join(lines)
    text = README.read_text(encoding="utf-8")
    if START not in text or END not in text:
        raise SystemExit("markers not found in events/README.md")
    pre, rest = text.split(START, 1)
    _, post = rest.split(END, 1)
    README.write_text(f"{pre}{START}\n{block}\n{END}{post}", encoding="utf-8", newline="\n")
    print(f"wrote {len(lines) - 2} rows into events/README.md")


if __name__ == "__main__":
    main()
