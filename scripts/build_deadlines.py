#!/usr/bin/env python3
"""Rebuild deadlines.md from the "At a glance" tables in every opportunity file.

Usage:  python scripts/build_deadlines.py            # writes deadlines.md
        python scripts/build_deadlines.py --check    # exit 1 if deadlines.md is stale

It reads each file listed in FILES, finds the first markdown table after the
"## At a glance" heading, and classifies every row by its Deadline cell:

  * bold exact date  **Oct 15, 2026**   -> exact  (earliest bold date >= today wins)
  * ~Mon YYYY / `~Mon DD, YYYY`         -> approximate window
  * Rolling                             -> rolling
  * Next: ... / all dates in the past   -> next cycle / watch

No third-party dependencies. Run it after every sweep and commit the result.
"""
from __future__ import annotations

import datetime as dt
import posixpath
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_links import slugify  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TODAY = dt.date.today()

# (file, type label shown in the calendar)
FILES = [
    ("internships/research-india.md", "Research internship"),
    ("internships/research-global.md", "Research internship"),
    ("internships/tech-companies.md", "Internship"),
    ("internships/finance-quant-consulting.md", "Internship"),
    ("internships/government-and-non-tech.md", "Internship"),
    ("open-source/README.md", "Open source"),
    ("fellowships/study-abroad.md", "Scholarship"),
    ("fellowships/india.md", "Fellowship"),
    ("fellowships/research-and-networking.md", "Research / grant"),
    ("startups/README.md", "Startup"),
    ("hackathons/README.md", "Hackathon"),
    ("competitions/competitive-programming.md", "Competition"),
    ("competitions/case-business-and-research.md", "Competition"),
    ("communities/ambassador-programs.md", "Community"),
]

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}

ROW_RE = re.compile(r"^\|\s*\[(?P<name>[^\]]+)\]\(#(?P<anchor>[^)]+)\)\s*\|(?P<rest>.*)\|\s*$")
BOLD_DATE_RE = re.compile(r"\*\*([A-Z][a-z]{2,8})\.? (\d{1,2}), (\d{4})\*\*")
BOLD_RANGE_RE = re.compile(r"\*\*([A-Z][a-z]{2,8})\.? (\d{1,2})\s*[–-]\s*([A-Z][a-z]{2,8})\.? (\d{1,2}), (\d{4})\*\*")
BOLD_MONTH_RE = re.compile(r"\*\*([A-Z][a-z]{2,8})\.? (\d{4})(?:\s*[–-]\s*([A-Z][a-z]{2,8})\.? (\d{4}))?\*\*")
APPROX_RE = re.compile(r"~\s*(?:(early|mid|late)[- ]?)?([A-Z][a-z]{2,8})(?:\s*[–-]\s*([A-Z][a-z]{2,8}))?\.?(?: (\d{1,2}))?(?:\s*[–-]\s*(\d{1,2}))?,? (\d{4})")
SEASON_RE = re.compile(r"~\s*(Spring|Summer|Autumn|Fall|Winter) (\d{4})", re.I)
YEAR_ONLY_RE = re.compile(r"~\s*(\d{4})")
SEASON_MONTH = {"spring": 3, "summer": 6, "autumn": 9, "fall": 9, "winter": 12}


def parse_bold_dates(cell: str) -> list[dt.date]:
    """Exact bold dates. For a bold range the END of the range is the deadline."""
    out = []
    for mon, day, year in BOLD_DATE_RE.findall(cell):
        m = MONTHS.get(mon[:3].lower())
        if m:
            try:
                out.append(dt.date(int(year), m, int(day)))
            except ValueError:
                pass
    for _, _, mon2, day2, year in BOLD_RANGE_RE.findall(cell):
        m = MONTHS.get(mon2[:3].lower())
        if m:
            try:
                out.append(dt.date(int(year), m, int(day2)))
            except ValueError:
                pass
    return out


def parse_bold_month(cell: str) -> dt.date | None:
    """Bold month-only windows like **Dec 2026 – Jan 2027** -> approximate (end of window)."""
    m = BOLD_MONTH_RE.search(cell)
    if not m:
        return None
    mon, year, mon2, year2 = m.groups()
    if mon2:
        mi = MONTHS.get(mon2[:3].lower()); y = int(year2)
    else:
        mi = MONTHS.get(mon[:3].lower()); y = int(year)
    return dt.date(y, mi, 28) if mi else None


def parse_approx(cell: str) -> dt.date | None:
    m = APPROX_RE.search(cell)
    if m:
        _, mon, mon2, day, day2, year = m.groups()
        mi = MONTHS.get((mon2 or mon)[:3].lower())
        if mi:
            d = int(day2 or day) if (day2 or day) else (28 if mon2 else 15)
            try:
                return dt.date(int(year), mi, d)
            except ValueError:
                return dt.date(int(year), mi, 28)
    m = SEASON_RE.search(cell)
    if m:
        return dt.date(int(m.group(2)), SEASON_MONTH[m.group(1).lower()], 15)
    m = YEAR_ONLY_RE.search(cell)
    if m:
        return dt.date(int(m.group(1)), 6, 15)
    return None


def split_cells(rest: str) -> list[str]:
    # split on pipes that are not inside links/backticks (good enough for our tables)
    cells, buf, depth = [], "", 0
    for ch in rest:
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth = max(0, depth - 1)
        if ch == "|" and depth == 0:
            cells.append(buf.strip())
            buf = ""
        else:
            buf += ch
    cells.append(buf.strip())
    return cells


def load_rows():
    rows = []
    for rel, label in FILES:
        path = ROOT / rel
        if not path.exists():
            print(f"warn: missing {rel}", file=sys.stderr)
            continue
        text = path.read_text(encoding="utf-8")
        idx = text.find("## At a glance")
        if idx < 0:
            print(f"warn: no 'At a glance' in {rel}", file=sys.stderr)
            continue
        in_table = False
        for line in text[idx:].splitlines()[1:]:
            if line.startswith("|"):
                in_table = True
                m = ROW_RE.match(line)
                if not m:
                    continue
                cells = split_cells(m.group("rest"))
                if len(cells) < 4:
                    continue
                deadline, funded, who, stage = cells[0], cells[1], cells[2], cells[3]
                rows.append(dict(name=m.group("name"), link=f"{rel}#{m.group('anchor')}",
                                 deadline=deadline, funded=funded, who=who, stage=stage, type=label))
            elif in_table and line.strip() == "":
                break
    return rows


STUB_RE = re.compile(r"Full entry[^\[\n]*\[[^\]\n]*\]\(([^)#\s]*)#([^)\s]+)\)")


def stub_target(rel: str, block: str) -> str | None:
    """A stub is a short cross-reference ("Full entry: [file](path.md#anchor)") to an entry kept in
    another file. Returns that entry's id ("path/file.md#anchor"), or None for a full entry."""
    m = STUB_RE.search(block)
    if not m or not m.group(1):
        return None
    dest = posixpath.normpath(posixpath.join(posixpath.dirname(rel), m.group(1)))
    return f"{dest}#{m.group(2)}"


def stub_links(rel: str, text: str) -> dict[str, str]:
    """{anchor of each stub entry in this file: id of the full entry it points to}."""
    out: dict[str, str] = {}
    seen: dict[str, int] = {}
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if not line.startswith("### "):
            continue
        base = slugify(line[4:].strip())
        k = seen.get(base, 0)
        seen[base] = k + 1
        block = []
        for nxt in lines[i + 1:]:
            if nxt.startswith("### ") or nxt.startswith("## "):
                break
            block.append(nxt)
        target = stub_target(rel, "\n".join(block))
        if target:
            out[base if k == 0 else f"{base}-{k}"] = target
    return out


def classify(row):
    cell = row["deadline"]
    unverified = "Unverified" in cell or "⚠️" in cell
    bold = [d for d in parse_bold_dates(cell) if d >= TODAY]
    if bold:
        return "exact", min(bold), unverified
    if "Rolling" in cell or "Always open" in cell or "Year-round" in cell:
        return "rolling", None, unverified
    if cell.startswith("Next") or "Next:" in cell or "passed" in cell.lower():
        d = parse_approx(cell)
        return "next", d, unverified
    d = parse_approx(cell) or parse_bold_month(cell)
    if d:
        return ("approx", d, unverified) if d >= TODAY - dt.timedelta(days=20) else ("next", d, unverified)
    if parse_bold_dates(cell):  # only past bold dates
        return "next", None, unverified
    return "watch", None, unverified


def status_emoji(d: dt.date) -> str:
    days = (d - TODAY).days
    if days <= 30:
        return "🔴"
    if days <= 60:
        return "🟠"
    if days <= 90:
        return "🟡"
    return "🟢"


def fmt(d: dt.date) -> str:
    return d.strftime("%b %d, %Y").replace(" 0", " ")


def clean(s: str, n: int = 60) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def build() -> str:
    rows = load_rows()
    # A program with a full entry in one file and a stub in another is listed once, under the full entry.
    stubs: dict[str, str] = {}
    for rel, _ in FILES:
        if (ROOT / rel).exists():
            for anchor, target in stub_links(rel, (ROOT / rel).read_text(encoding="utf-8")).items():
                stubs[f"{rel}#{anchor}"] = target
    listed = {r["link"] for r in rows}
    rows = [r for r in rows if stubs.get(r["link"]) not in listed]
    exact, approx, rolling, nxt, watch = [], [], [], [], []
    for r in rows:
        kind, d, unv = classify(r)
        r["unv"] = unv
        r["date"] = d
        {"exact": exact, "approx": approx, "rolling": rolling, "next": nxt, "watch": watch}[kind].append(r)
    exact.sort(key=lambda r: (r["date"], r["name"]))
    approx.sort(key=lambda r: (r["date"], r["name"]))
    nxt.sort(key=lambda r: (r["date"] or dt.date(2999, 1, 1), r["name"]))
    rolling.sort(key=lambda r: (r["type"], r["name"]))
    watch.sort(key=lambda r: (r["type"], r["name"]))

    out = []
    out.append("# All Deadlines\n")
    out.append("Every dated entry in this repo, in one place. **Generated** from the At-a-glance tables by "
               "`scripts/build_deadlines.py`. To change something, edit the source file and rerun the script.\n")
    out.append(f"**Built:** {fmt(TODAY)} · **Status key:** 🔴 ≤30 days · 🟠 31–60 · 🟡 61–90 · 🟢 later · "
               "`~` approximate window · ⚠️ could not be verified this cycle\n")
    out.append("**Jump to:** [Exact deadlines](#exact-deadlines) · [Approximate windows](#approximate-windows-by-month) · "
               "[Rolling](#rolling--always-open) · [Next cycle](#next-cycle--watch)\n")
    out.append("---\n")

    out.append("## Exact deadlines\n")
    out.append("| | Deadline | Opportunity | Type | Funded | Stage |")
    out.append("|--|----------|-------------|------|--------|-------|")
    for r in exact:
        flag = " ⚠️" if (r["unv"] and "⚠️" not in r["deadline"]) else ""
        out.append(f"| {status_emoji(r['date'])} | **{fmt(r['date'])}**{flag} | [{clean(r['name'])}]({r['link']}) | "
                   f"{r['type']} | {clean(r['funded'], 40)} | {clean(r['stage'], 20)} |")
    out.append("")

    out.append("## Approximate windows (by month)\n")
    out.append("Expected from last cycle's pattern. Confirm on the official page once the call is out.\n")
    cur = None
    for r in approx:
        key = r["date"].strftime("%B %Y")
        if key != cur:
            cur = key
            out.append(f"\n### {key}\n")
            out.append("| Window | Opportunity | Type | Funded | Stage |")
            out.append("|--------|-------------|------|--------|-------|")
        flag = " ⚠️" if (r["unv"] and "⚠️" not in r["deadline"]) else ""
        out.append(f"| {clean(r['deadline'], 48)}{flag} | [{clean(r['name'])}]({r['link']}) | {r['type']} | "
                   f"{clean(r['funded'], 40)} | {clean(r['stage'], 20)} |")
    out.append("")

    out.append("## Rolling / always open\n")
    out.append("| Opportunity | Type | Funded | Who | Notes |")
    out.append("|-------------|------|--------|-----|-------|")
    for r in rolling:
        flag = " ⚠️" if (r["unv"] and "⚠️" not in r["deadline"]) else ""
        out.append(f"| [{clean(r['name'])}]({r['link']}) | {r['type']} | {clean(r['funded'], 40)} | "
                   f"{clean(r['who'], 50)} | {clean(r['deadline'], 48)}{flag} |")
    out.append("")

    out.append("## Next cycle / watch\n")
    out.append("This cycle has closed, or no date is published. Watch the official site.\n")
    out.append("| Opportunity | Type | Expected | Funded | Stage |")
    out.append("|-------------|------|----------|--------|-------|")
    for r in nxt + watch:
        flag = " ⚠️" if (r["unv"] and "⚠️" not in r["deadline"]) else ""
        out.append(f"| [{clean(r['name'])}]({r['link']}) | {r['type']} | {clean(r['deadline'], 48)}{flag} | "
                   f"{clean(r['funded'], 40)} | {clean(r['stage'], 20)} |")
    out.append("")
    out.append("---\n")
    out.append(f"*{len(rows)} entries across {len(FILES)} files. Events have their own calendar in "
               "[events/README.md](events/README.md). Always verify on the official portal before submitting.*\n")
    return "\n".join(out)


def main():
    content = build()
    target = ROOT / "deadlines.md"
    if "--check" in sys.argv:
        current = target.read_text(encoding="utf-8") if target.exists() else ""
        # ignore the Built: line when comparing
        strip = lambda s: re.sub(r"\*\*Built:\*\* [^·]+", "", s)
        if strip(current) != strip(content):
            print("deadlines.md is stale - run: python scripts/build_deadlines.py")
            sys.exit(1)
        print("deadlines.md is up to date")
        return
    target.write_text(content, encoding="utf-8", newline="\n")
    print(f"wrote {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
