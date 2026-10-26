#!/usr/bin/env python3
"""Rebuild drops.md: every one-off or limited-edition opportunity, in one list.

Usage:  python scripts/build_drops.py            # writes drops.md
        python scripts/build_drops.py --check    # exit 1 if drops.md is stale or a drop is missing its expiry

A drop is a normal entry in its normal category file whose tag line says it won't come round again:
  <!-- tags: stage=ug,pg; field=ai; region=global; funding=prize; citizenship=any; gates=team; format=remote; edition=one-off; expires=2026-11-21 -->

`expires` is the last day the drop matters (the event's last day, or the final deadline). Until then it is
listed under "Open now"; for 60 days after, under "Recently ended"; after that it leaves this page and the
entry itself is removed from its file at the next sweep. The website hides expired drops on its own.
"""
from __future__ import annotations

import datetime as dt
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_deadlines as bd  # noqa: E402
import build_site_data as bsd  # noqa: E402
from check_links import slugify  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TODAY = dt.date.today()
KEEP_ENDED_DAYS = 60
ISSUE = "https://github.com/shahanxd/undumployed/issues/new?template=spotted-a-drop.yml"


def shorten(s: str, n: int) -> str:
    """Cut at a word boundary, so the table never shows half a word."""
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) <= n:
        return s
    return s[: n - 1].rsplit(" ", 1)[0].rstrip(",;:·(") + "…"


def first_sentence(md: str, n: int = 100) -> str:
    s = bsd.strip_md(md)
    m = re.match(r"(.+?[.!?])(\s|$)", s)
    return shorten(m.group(1) if m else s, n)


def collect() -> tuple[list[dict], list[str]]:
    drops, errors = [], []
    short = dict(bd.FILES)  # the calendar's short type labels
    files = [(rel, short.get(rel, label), False) for rel, (_, label, _) in bsd.CATEGORIES.items()]
    files += [(rel, "Event", True) for rel in bsd.EVENT_FILES]
    for rel, label, is_event in files:
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        rows = bsd.at_a_glance_rows(text)
        seen: dict[str, int] = {}
        for _, heading, block in bsd.entry_blocks(text):
            base = slugify(heading)
            k = seen.get(base, 0)
            seen[base] = k + 1
            anchor = base if k == 0 else f"{base}-{k}"
            tags = bsd.parse_tags(block) or {}
            if tags.get("edition") != "one-off":
                continue
            where = f"{rel}#{anchor}"
            if not tags.get("expires"):
                errors.append(f"{where}: edition=one-off needs expires=YYYY-MM-DD in its tag line")
                continue
            lines = block.splitlines()
            header = bsd.parse_header(lines[0]) if lines and lines[0].startswith(">") else {}
            table = bsd.parse_table(lines)
            sections = bsd.parse_sections(block)
            row = rows.get(anchor)
            if is_event:
                when = header.get("dates", "") or (row[0] if row else "")
                funded = table.get("Cost", "") or header.get("access", "")
                who = table.get("Student angle", "")
            else:
                when = (row[0] if row else "") or table.get("Deadline", "")
                funded = (row[1] if row and len(row) > 1 else "") or header.get("funded", "")
                who = (row[2] if row and len(row) > 2 else "") or table.get("Who", "")
            _, date, _ = bd.classify({"deadline": when})
            drops.append(dict(
                name=bsd.strip_md(heading), link=where, type=label,
                when=when, date=date, expires=dt.date.fromisoformat(tags["expires"]),
                funded=funded, who=who, what=first_sentence(sections.get("What it is", "") or bsd.first_prose(block)),
            ))
    return drops, errors


def build(drops: list[dict]) -> str:
    live = sorted((d for d in drops if d["expires"] >= TODAY), key=lambda d: (d["date"] or d["expires"], d["name"]))
    cutoff = TODAY - dt.timedelta(days=KEEP_ENDED_DAYS)
    ended = sorted((d for d in drops if cutoff <= d["expires"] < TODAY), key=lambda d: d["expires"], reverse=True)

    out = ["# Drops\n"]
    out.append("One-off and limited-edition opportunities: a hackathon a lab runs once, a sponsored sprint, a first cohort. "
               "They're announced a few weeks ahead and gone a month later, so they get their own list. Each one is a normal "
               "entry in its category file (a hackathon drop is also under [Hackathons](hackathons/README.md)), and this page is "
               "**generated** from them by `scripts/build_drops.py`.\n")
    out.append(f"**Built:** {bd.fmt(TODAY)} · **What gets in:** [the quality bar](CONTRIBUTING.md#drops-one-off-opportunities) · "
               f"Spotted a good one? [Tell us]({ISSUE})\n")
    out.append("---\n")

    out.append("## Open now\n")
    if live:
        out.append("| Apply by | Drop | Type | What | Funded | Ends |")
        out.append("|----------|------|------|------|--------|------|")
        for d in live:
            when = d["when"].split(" · ")[0]  # the first date is the one to act on
            out.append(f"| {shorten(when, 48)} | [{d['name']}]({d['link']}) | {d['type']} | {d['what']} | "
                       f"{shorten(d['funded'], 40)} | {bd.fmt(d['expires'])} |")
    else:
        out.append("Nothing open right now.")
    out.append("")

    out.append("## Recently ended\n")
    if ended:
        out.append("| Ended | Drop | Type |")
        out.append("|-------|------|------|")
        for d in ended:
            out.append(f"| {bd.fmt(d['expires'])} | [{d['name']}]({d['link']}) | {d['type']} |")
    else:
        out.append("None in the last 60 days.")
    out.append("")
    out.append("---\n")
    out.append(f"*{len(live)} open · {len(ended)} recently ended. Ended drops leave this page {KEEP_ENDED_DAYS} days after they "
               "close. Always confirm on the official page before you sign up.*\n")
    return "\n".join(out)


def main():
    drops, errors = collect()
    for e in errors:
        print(f"error: {e}", file=sys.stderr)
    content = build(drops)
    target = ROOT / "drops.md"
    if "--check" in sys.argv:
        current = target.read_text(encoding="utf-8") if target.exists() else ""
        strip = lambda s: re.sub(r"\*\*Built:\*\* [^·]+", "", s)
        if errors or strip(current) != strip(content):
            if not errors:
                print("drops.md is stale - run: python scripts/build_drops.py")
            sys.exit(1)
        print("drops.md is up to date")
        return
    if errors:
        sys.exit(1)
    target.write_text(content, encoding="utf-8", newline="\n")
    print(f"wrote {target.relative_to(ROOT)} ({len(drops)} drops)")


if __name__ == "__main__":
    main()
