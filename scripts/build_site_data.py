#!/usr/bin/env python3
"""Build the JSON the website reads from the markdown files.

Usage:  python scripts/build_site_data.py          # writes site/data/*.json and copies guides
        python scripts/build_site_data.py --check  # exit 1 if site/data is stale

The markdown is the source of truth. This script parses:
  * every opportunity file's "### entry" blocks + its At-a-glance row  -> site/data/opportunities.json
  * every events file                                                  -> site/data/events.json
  * student-perks/README.md tables                                     -> site/data/perks.json
  * guides/*.md + CONTRIBUTING.md                                       -> site/data/guides/*.md (verbatim)
  * counts, categories, facet vocab, build date                         -> site/data/meta.json

Facets (stage, field, region, funding, citizenship, gates, format) come from an
HTML comment right under each heading:  <!-- tags: stage=ug,pg; field=cs,ai; region=europe; funding=stipend; citizenship=any; gates=faculty-first; format=in-person -->
When an entry has no tag line, heuristics fill the facets in and the entry is marked "tags_inferred": true.
"""
from __future__ import annotations

import datetime as dt
import json
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_deadlines as bd  # noqa: E402
import build_events_calendar as bec  # noqa: E402
from check_links import slugify  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "data"
TODAY = dt.date.today()

# file -> (category id, label, group)
CATEGORIES = {
    "internships/research-india.md": ("research-india", "Research internship · India", "internship"),
    "internships/research-global.md": ("research-global", "Research internship · Global", "internship"),
    "internships/tech-companies.md": ("tech", "Tech internship", "internship"),
    "internships/finance-quant-consulting.md": ("finance", "Finance, quant & consulting", "internship"),
    "internships/government-and-non-tech.md": ("govt-nontech", "Government, policy & non-tech", "internship"),
    "open-source/README.md": ("open-source", "Paid open source", "open-source"),
    "fellowships/study-abroad.md": ("study-abroad", "Study-abroad scholarship", "fellowship"),
    "fellowships/india.md": ("fellowship-india", "Fellowship & scholarship · India", "fellowship"),
    "fellowships/research-and-networking.md": ("research-fellowship", "Research fellowship, forum & grant", "fellowship"),
    "startups/README.md": ("startup", "Startup & builder program", "startup"),
    "hackathons/README.md": ("hackathon", "Hackathon", "competition"),
    "competitions/competitive-programming.md": ("cp", "Competitive programming", "competition"),
    "competitions/case-business-and-research.md": ("case-research", "Case, business & research competition", "competition"),
    "communities/ambassador-programs.md": ("ambassador", "Ambassador program", "community"),
    "communities/brand-insider-programs.md": ("insider", "Brand insider program", "community"),
}
EVENT_FILES = {
    "events/tech-global.md": ("tech", "Tech & developer"),
    "events/research-conferences.md": ("research", "Research conference"),
    "events/india.md": ("india", "India"),
    "events/arts-culture.md": ("arts", "Arts, culture & sport"),
}
GUIDES = ["guides/timeline-by-year.md", "guides/application-kit.md", "guides/how-to-cold-email.md",
          "guides/interviews-and-tests.md", "guides/visas-for-indian-passport.md", "CONTRIBUTING.md"]

VOCAB = {
    "stage": ["hs", "ug", "pg", "phd", "grad"],
    "field": ["cs", "ai", "ee", "mech", "civil", "physics", "math", "chem", "bio", "med", "design", "business",
              "econ", "policy", "law", "humanities", "media", "edu", "any"],
    "region": ["india", "remote", "europe", "uk", "north-america", "east-asia", "southeast-asia", "middle-east",
               "australia", "global"],
    "funding": ["full", "stipend", "prize", "free", "unpaid", "loan"],
    "citizenship": ["any", "indian-only", "other"],
    "gates": ["nomination", "faculty-first", "campus-only", "women-only", "diversity", "noc", "team", "age-limit",
              "work-experience", "enrolled-only", "invite-only"],
    "format": ["in-person", "remote", "hybrid"],
}

ROW_RE = re.compile(r"^\|\s*\[(?P<name>[^\]]+)\]\(#(?P<anchor>[^)]+)\)\s*\|(?P<rest>.*)\|\s*$")
HEADER_RE = re.compile(r"\*\*([A-Za-z ]+):\*\*\s*([^|]*)")
TAG_RE = re.compile(r"<!--\s*tags:\s*(.*?)\s*-->", re.S)
URL_RE = re.compile(r"\((https?://[^)\s]+)\)")
BOLD_SECTION_RE = re.compile(r"^\*\*([A-Za-z][A-Za-z ’'/&-]{1,40}):\*\*\s*(.*)$")


def strip_md(s: str) -> str:
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
    s = s.replace("**", "").replace("`", "")
    return re.sub(r"\s+", " ", s).strip()


def split_cells(rest: str) -> list[str]:
    return bd.split_cells(rest)


def parse_table(lines: list[str]) -> dict[str, str]:
    """Two-column | Field | Details | table -> dict."""
    out = {}
    for line in lines:
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in split_cells(line.strip().strip("|"))]
        if len(cells) < 2 or set(cells[0]) <= {"-"} or cells[0] in ("Field",):
            continue
        out[cells[0].strip("*").strip()] = cells[1]
    return out


def parse_header(line: str) -> dict[str, str]:
    return {k.strip().lower(): strip_md(v) for k, v in HEADER_RE.findall(line)}


def parse_tags(block: str) -> dict | None:
    m = TAG_RE.search(block)
    if not m:
        return None
    tags = {}
    for part in m.group(1).split(";"):
        if "=" not in part:
            continue
        k, v = part.split("=", 1)
        k = k.strip()
        vals = [x.strip() for x in v.split(",") if x.strip()]
        if k in ("stage", "field", "gates"):
            tags[k] = [x for x in vals if x in VOCAB[k]]
        elif k in VOCAB:
            tags[k] = vals[0] if vals and vals[0] in VOCAB[k] else None
    return tags


# ---------------------------------------------------------------- heuristics
REGION_HINTS = [
    ("india", ["india", "delhi", "mumbai", "bengaluru", "bangalore", "hyderabad", "chennai", "pune", "kolkata",
               "gurugram", "gurgaon", "noida", "kanpur", "kharagpur", "roorkee", "gandhinagar", "prayagraj",
               "jodhpur", "mandi", "ropar", "palakkad", "bhubaneswar", "dhanbad", "guwahati", "indore", "varanasi",
               "tirupati", "mohali", "bhopal", "ahmedabad", "goa", "kochi", "jaipur", "chandigarh", "kerala",
               "tamil nadu", "karnataka", "gujarat", "maharashtra", "telangana", "iit", "iisc", "iiser", "tifr"]),
    ("remote", ["remote", "online", "virtual", "anywhere"]),
    ("uk", ["uk", "united kingdom", "london", "oxford", "cambridge", "edinburgh", "manchester", "imperial"]),
    ("europe", ["germany", "france", "switzerland", "netherlands", "sweden", "finland", "denmark", "austria",
                "italy", "spain", "portugal", "belgium", "ireland", "czech", "poland", "hungary", "norway",
                "europe", "eu ", "geneva", "zurich", "lausanne", "berlin", "munich", "paris", "lisbon", "prague",
                "helsinki", "vienna", "amsterdam", "brussels", "milan", "budapest", "athens"]),
    ("north-america", ["usa", "u.s.", "united states", "canada", "california", "new york", "boston", "toronto",
                       "vancouver", "montréal", "montreal", "seattle", "san francisco", "las vegas", "austin",
                       "chicago", "pasadena", "stanford", "mit ", "caltech", "waterloo", "pittsburgh", "denver",
                       "anaheim", "san jose", "salt lake", "long beach", "baltimore", "providence"]),
    ("east-asia", ["japan", "tokyo", "okinawa", "kyoto", "korea", "seoul", "daejeon", "china", "beijing",
                   "shanghai", "taiwan", "taipei", "hong kong", "tsukuba"]),
    ("southeast-asia", ["singapore", "malaysia", "indonesia", "bali", "thailand", "vietnam", "philippines"]),
    ("middle-east", ["uae", "dubai", "abu dhabi", "saudi", "kaust", "israel", "weizmann", "qatar", "türkiye",
                     "turkey", "antalya", "istanbul"]),
    ("australia", ["australia", "sydney", "melbourne", "new zealand", "auckland"]),
]
FIELD_HINTS = {
    "cs": ["computer science", "software", "cs", "cse", "programming", "coding", "developer", "open source",
           "open-source", "swe", "sde"],
    "ai": ["machine learning", "ml", "ai", "artificial intelligence", "data science", "deep learning",
           "nlp", "computer vision"],
    "ee": ["electronics", "electrical", "ee", "ece", "semiconductor", "vlsi", "hardware", "embedded",
           "signal processing"],
    "mech": ["mechanical", "aerospace", "aeronautic", "automotive", "robotics", "manufacturing", "me"],
    "civil": ["civil", "architecture", "urban", "construction"],
    "physics": ["physics", "physical sciences", "astronomy", "astrophysics", "particle"],
    "math": ["mathematics", "maths", "math ", "statistics", "probability", "quant"],
    "chem": ["chemistry", "chemical", "materials"],
    "bio": ["biology", "biotech", "life science", "biomedical", "bioinformatics", "neuroscience", "genetics",
            "agricultur"],
    "med": ["medicine", "medical", "mbbs", "pharma", "public health", "clinical", "health"],
    "design": ["designer", "designers", "ux", "ui/ux", "product design", "graphic design", "industrial design", "fashion", "design students", "design track"],
    "business": ["business", "management", "finance", "consulting", "mba", "entrepreneur", "startup", "founder",
                 "commerce", "marketing"],
    "econ": ["economics", "econ", "economist"],
    "policy": ["policy", "public policy", "social science", "development", "international relations",
               "governance", "political"],
    "law": ["law", "legal", "llb"],
    "humanities": ["humanities", "history", "philosophy", "literature", "languages", "liberal arts"],
    "media": ["journalism", "journalist", "media", "film", "photography", "creative writing", "filmmaker"],
    "edu": ["education", "teaching", "teacher"],
}


def infer_region(location: str, fmt_hint: str) -> str:
    text = f"{location} {fmt_hint}".lower()
    hits = [r for r, words in REGION_HINTS if any(w in text for w in words)]
    if "india" in hits and len(hits) > 1:
        return "global"
    if hits:
        return hits[0]
    if any(w in text for w in ("worldwide", "multiple", "varies", "various", "global")):
        return "global"
    return "global"


def infer_funding(funded: str) -> str:
    f = funded.lower()
    if "loan" in f:
        return "loan"
    if "❌" in f and ("unpaid" in f or "you pay" in f or "cost" in f or "ticket" in f):
        return "unpaid"
    if "❌" in f or "free" in f and "✅" not in f:
        return "free" if "unpaid" not in f else "unpaid"
    if "prize" in f or "investment" in f or "grant" in f and "prize" in f:
        return "prize"
    if "full" in f or "fully" in f:
        return "full"
    if "✅" in f or "stipend" in f or "paid" in f or "₹" in f or "$" in f or "€" in f or "chf" in f:
        return "stipend"
    return "free"


def infer_stage(stage_cell: str, who: str) -> list[str]:
    s = (stage_cell or "").lower()
    out = []
    if "hs" in s or "school" in s or "class" in s:
        out.append("hs")
    if "ug" in s or "bachelor" in s or "b.tech" in s or "undergrad" in s:
        out.append("ug")
    if "pg" in s or "master" in s or "mba" in s or "m.tech" in s or "msc" in s:
        out.append("pg")
    if "phd" in s or "doctoral" in s:
        out.append("phd")
    if "grad" in s or "any" in s or "postdoc" in s or "early career" in s or "professional" in s or "+" in s:
        out.append("grad")
    if "any" in s:
        out = ["hs", "ug", "pg", "phd", "grad"]
    if not out:
        w = (who or "").lower()
        if "school" in w or "class 1" in w:
            out.append("hs")
        if "undergrad" in w or "b.tech" in w or "bachelor" in w or "ug" in w:
            out.append("ug")
        if "master" in w or "m.tech" in w or "pg" in w or "msc" in w:
            out.append("pg")
        if "phd" in w:
            out.append("phd")
        if "graduate" in w and "under" not in w:
            out.append("grad")
    return out or ["ug", "pg"]


_FIELD_PATTERNS = {f: re.compile(r"(?<![a-z])(?:" + "|".join(re.escape(w.strip()) for w in words) + r")(?![a-z])")
                   for f, words in FIELD_HINTS.items()}


def infer_fields(text: str) -> list[str]:
    t = text.lower()
    if any(w in t for w in ("any field", "all fields", "any discipline", "all disciplines", "any stream", "any subject", "any background")):
        return ["any"]
    out = [f for f, pat in _FIELD_PATTERNS.items() if pat.search(t)]
    return out[:6] or ["any"]


def infer_gates(text: str) -> list[str]:
    t = text.lower()
    g = []
    if "nominat" in t:
        g.append("nomination")
    if "faculty-first" in t or "professor" in t and "consent" in t or "faculty first" in t:
        g.append("faculty-first")
    if "spoc" in t or "placement cell" in t or "campus-only" in t or "through your institution" in t or "campus-driven" in t:
        g.append("campus-only")
    if "women" in t or "girl" in t or "female" in t:
        g.append("women-only")
    if "noc" in t:
        g.append("noc")
    if "team of" in t or "teams of" in t:
        g.append("team")
    if "work experience" in t or "years of experience" in t or "yrs exp" in t:
        g.append("work-experience")
    if "under 3" in t or "≤" in t and "years" in t or "age" in t and ("limit" in t or "under" in t):
        g.append("age-limit")
    if "invite" in t and "only" in t:
        g.append("invite-only")
    return g


def infer_citizenship(text: str) -> str:
    t = text.lower()
    if "indian citizen" in t or "indian national" in t or "citizens of india" in t or "indian students only" in t:
        return "indian-only"
    return "any"


# ---------------------------------------------------------------- parsing
def at_a_glance_rows(text: str) -> dict[str, list[str]]:
    rows = {}
    idx = text.find("## At a glance")
    if idx < 0:
        return rows
    in_table = False
    for line in text[idx:].splitlines()[1:]:
        if line.startswith("|"):
            in_table = True
            m = ROW_RE.match(line)
            if m:
                rows[m.group("anchor").lower()] = [c.strip() for c in split_cells(m.group("rest"))]
        elif in_table and line.strip() == "":
            break
        elif line.startswith("## "):
            break
    return rows


def entry_blocks(text: str):
    """Yield (section_title, heading, block_text) for each ### entry."""
    section = ""
    lines = text.splitlines()
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        if line.startswith("## "):
            section = line[3:].strip()
            i += 1
            continue
        if line.startswith("### "):
            heading = line[4:].strip()
            j = i + 1
            block = []
            while j < n and not lines[j].startswith("### ") and not lines[j].startswith("## "):
                block.append(lines[j])
                j += 1
            yield section, heading, "\n".join(block)
            i = j
            continue
        i += 1


def parse_sections(block: str) -> dict[str, str]:
    """Bold-label paragraphs: What it is / Reality check / Apply / Prep steps / etc."""
    out = {}
    cur = None
    buf: list[str] = []
    for line in block.splitlines():
        s = line.strip()
        if s.startswith("<!--") or s == "---":
            continue
        m = BOLD_SECTION_RE.match(s)
        if m:
            if cur:
                out[cur] = "\n".join(buf).strip()
            cur = m.group(1).strip()
            buf = [m.group(2)]
        elif cur and (s.startswith("|") or s.startswith(">")):
            out[cur] = "\n".join(buf).strip()
            cur = None
            buf = []
        elif cur:
            buf.append(line)
    if cur:
        out[cur] = "\n".join(buf).strip()
    return out


def first_prose(block: str) -> str:
    """First paragraph that is not a header quote, table, comment, or bold-labelled section."""
    for para in re.split(r"\n\s*\n", block):
        p = para.strip()
        if not p or p.startswith((">", "|", "<!--", "---", "*[", "*Last")):
            continue
        if BOLD_SECTION_RE.match(p.splitlines()[0]):
            continue
        return re.sub(r"\s+", " ", p)
    return ""


def build_opportunities():
    items = []
    for rel, (cat, label, group) in CATEGORIES.items():
        path = ROOT / rel
        if not path.exists():
            print(f"warn: missing {rel}", file=sys.stderr)
            continue
        text = path.read_text(encoding="utf-8")
        rows = at_a_glance_rows(text)
        seen: dict[str, int] = {}
        for section, heading, block in entry_blocks(text):
            base = slugify(heading)
            k = seen.get(base, 0)
            seen[base] = k + 1
            anchor = base if k == 0 else f"{base}-{k}"
            block_lines = block.splitlines()
            header = parse_header(block_lines[0]) if block_lines and block_lines[0].startswith(">") else {}
            table = parse_table(block_lines)
            sections = parse_sections(block)
            row = rows.get(anchor)
            deadline_cell = (row[0] if row else table.get("Deadline", "")) or table.get("Deadline", "")
            kind, date, unverified = bd.classify({"deadline": deadline_cell})
            unverified = unverified or ("⚠️" in table.get("Deadline", ""))
            apply_urls = URL_RE.findall(sections.get("Apply", "")) or URL_RE.findall(block)
            tags = parse_tags(block)
            who = table.get("Who", "") or (row[2] if row and len(row) > 2 else "")
            stage_cell = table.get("Stage", "") or (row[3] if row and len(row) > 3 else "")
            what = sections.get("What it is", "") or first_prose(block)
            reality = sections.get("Reality check", "")
            hay = " ".join([heading, header.get("type", ""), who, what, reality, table.get("Who", "")])
            inferred = tags is None
            facets = {
                "stage": (tags or {}).get("stage") or infer_stage(stage_cell, who),
                "field": (tags or {}).get("field") or infer_fields(hay),
                "region": (tags or {}).get("region") or infer_region(header.get("location", ""), header.get("type", "")),
                "funding": (tags or {}).get("funding") or infer_funding(header.get("funded", "") or (row[1] if row else "")),
                "citizenship": (tags or {}).get("citizenship") or infer_citizenship(hay),
                "gates": (tags or {}).get("gates") if tags and tags.get("gates") is not None else infer_gates(hay),
                "format": (tags or {}).get("format") or ("remote" if "remote" in header.get("location", "").lower() else "in-person"),
            }
            is_note = row is None and "Deadline" not in table
            items.append({
                "id": f"{rel}#{anchor}",
                "name": strip_md(heading),
                "file": rel,
                "anchor": anchor,
                "isNote": is_note,
                "category": cat,
                "categoryLabel": label,
                "group": group,
                "section": strip_md(section),
                "type": header.get("type", ""),
                "location": header.get("location", ""),
                "funded": header.get("funded", "") or (row[1] if row else ""),
                "status": header.get("status", ""),
                "deadline": strip_md(deadline_cell),
                "deadlineKind": kind,
                "deadlineDate": date.isoformat() if date else None,
                "unverified": bool(unverified),
                "duration": strip_md(table.get("Duration", "")),
                "who": strip_md(who),
                "stipend": strip_md(table.get("Stipend", "") or table.get("Value", "") or table.get("Prize", "")),
                "stageText": strip_md(stage_cell),
                "what": what,
                "reality": reality,
                "prep": sections.get("Prep steps", "") or sections.get("Prep", ""),
                "applyUrl": apply_urls[0] if apply_urls else "",
                "sourceUrl": f"https://github.com/{{repo}}/blob/master/{rel}#{anchor}",
                "table": {k: v for k, v in table.items() if k not in ("Deadline",)},
                "tagsInferred": inferred,
                "stubOf": bd.stub_target(rel, block),
                **facets,
            })
    return merge_stubs(items, "category", "alsoIn")


def build_events():
    items = []
    for rel, (kind, label) in EVENT_FILES.items():
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        rows = at_a_glance_rows(text)
        seen: dict[str, int] = {}
        for section, heading, block in entry_blocks(text):
            base = slugify(heading)
            k = seen.get(base, 0)
            seen[base] = k + 1
            anchor = base if k == 0 else f"{base}-{k}"
            block_lines = block.splitlines()
            header = parse_header(block_lines[0]) if block_lines and block_lines[0].startswith(">") else {}
            table = parse_table(block_lines)
            sections = parse_sections(block)
            row = rows.get(anchor)
            dates = header.get("dates", "") or (row[0] if row else "")
            start = bec.first_date(dates) if dates else None
            urls = URL_RE.findall(sections.get("Apply", "")) or URL_RE.findall(sections.get("Register", "")) or URL_RE.findall(block)
            tags = parse_tags(block)
            cost = table.get("Cost", "")
            free_virtual = bool(re.search(r"free", (cost + " " + header.get("access", "")).lower()))
            items.append({
                "id": f"{rel}#{anchor}",
                "name": strip_md(heading),
                "file": rel,
                "anchor": anchor,
                "kind": kind,
                "kindLabel": label,
                "section": strip_md(section),
                "dates": strip_md(dates),
                "startDate": start.isoformat() if start else None,
                "location": header.get("location", "") or (row[1] if row and len(row) > 1 else ""),
                "access": header.get("access", "") or (row[2] if row and len(row) > 2 else ""),
                "cost": strip_md(cost),
                "studentAngle": strip_md(table.get("Student angle", "") or (row[3] if row and len(row) > 3 else "")),
                "visa": strip_md(table.get("Visa", "")),
                "register": strip_md(table.get("Register", "")),
                "what": sections.get("What it is", ""),
                "applyUrl": urls[0] if urls else "",
                "unverified": "⚠️" in dates or "nverified" in dates,
                "freeOrVirtual": free_virtual,
                "region": (tags or {}).get("region") or infer_region(header.get("location", ""), ""),
                "field": (tags or {}).get("field") or infer_fields(" ".join([heading, sections.get("What it is", ""), section])),
                "tagsInferred": tags is None,
                "sourceUrl": f"https://github.com/{{repo}}/blob/master/{rel}#{anchor}",
                "stubOf": bd.stub_target(rel, block),
            })
    return merge_stubs(items, "kind", "alsoKinds")


ALIASES: dict[str, str] = {}


def merge_stubs(items: list[dict], key: str, also_key: str) -> list[dict]:
    """Fold each stub into the full entry it points to, so a program is listed once but can still be
    found under the stub's category. The stub's id becomes an alias, so old links keep working.
    A stub whose full entry isn't in this list (say, an event pointed at from a hackathon file) stays."""
    by_id = {it["id"]: it for it in items}
    out = []
    for it in items:
        target = by_id.get(it.pop("stubOf", None) or "")
        if target is None or target is it or target.get("stubOf"):
            out.append(it)
            continue
        also = target.setdefault(also_key, [])
        if it[key] != target[key] and it[key] not in also:
            also.append(it[key])
        ALIASES[it["id"]] = target["id"]
    for it in out:
        it.setdefault(also_key, [])
    return out


def build_perks():
    path = ROOT / "student-perks" / "README.md"
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    items = []
    section = ""
    header: list[str] = []
    for line in text.splitlines():
        if line.startswith("## "):
            section = line[3:].strip()
            header = []
            continue
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in split_cells(line.strip().strip("|"))]
        if not header:
            header = [strip_md(c) for c in cells]
            continue
        if set("".join(cells)) <= {"-", " ", ":"}:
            continue
        if header[:1] != ["Perk"] or len(cells) < 6:
            continue
        link = URL_RE.findall(cells[5])
        india = cells[4]
        items.append({
            "id": f"perk-{slugify(cells[0])}",
            "name": strip_md(cells[0]),
            "section": section,
            "what": strip_md(cells[1]),
            "requirement": strip_md(cells[2]),
            "duration": strip_md(cells[3]),
            "india": "✅" if "✅" in india else ("❌" if "❌" in india else "⚠️"),
            "url": link[0] if link else "",
            "linkText": strip_md(cells[5]),
            "unverified": "⚠️" in line,
        })
    return items


def guides_meta():
    out = []
    for rel in GUIDES:
        p = ROOT / rel
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        title = next((l[2:].strip() for l in text.splitlines() if l.startswith("# ")), rel)
        desc = next((l[2:].strip() for l in text.splitlines() if l.startswith("> ")), "")
        out.append({"file": rel, "slug": Path(rel).stem.lower(), "title": strip_md(title), "description": strip_md(desc)})
    return out


def dump(name: str, obj, check: bool) -> bool:
    target = OUT / name
    data = json.dumps(obj, ensure_ascii=False, indent=0, sort_keys=False)
    if check:
        return target.exists() and target.read_text(encoding="utf-8") == data
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(data, encoding="utf-8", newline="\n")
    return True


def main():
    check = "--check" in sys.argv
    opps = build_opportunities()
    events = build_events()
    perks = build_perks()
    guides = guides_meta()
    meta = {
        "builtOn": TODAY.isoformat(),
        "lastVerified": "September 2026",
        "counts": {"opportunities": len(opps), "events": len(events), "perks": len(perks),
                   "inferredTags": sum(1 for o in opps if o["tagsInferred"]),
                   "unverified": sum(1 for o in opps if o["unverified"])},
        "categories": [{"id": c, "label": l, "group": g, "file": f} for f, (c, l, g) in CATEGORIES.items()],
        "eventKinds": [{"id": k, "label": l, "file": f} for f, (k, l) in EVENT_FILES.items()],
        "vocab": VOCAB,
        "guides": guides,
        "aliases": dict(sorted(ALIASES.items())),
    }
    ok = True
    ok &= dump("opportunities.json", opps, check)
    ok &= dump("events.json", events, check)
    ok &= dump("perks.json", perks, check)
    if check:
        # meta carries the build date; compare everything but that
        target = OUT / "meta.json"
        cur = json.loads(target.read_text(encoding="utf-8")) if target.exists() else {}
        cur.pop("builtOn", None)
        m2 = dict(meta)
        m2.pop("builtOn")
        ok &= cur == m2
        for rel in GUIDES:
            src = ROOT / rel
            dst = OUT / "guides" / Path(rel).name
            ok &= dst.exists() and dst.read_text(encoding="utf-8") == src.read_text(encoding="utf-8")
        print("site/data is up to date" if ok else "site/data is stale - run: python scripts/build_site_data.py")
        sys.exit(0 if ok else 1)
    dump("meta.json", meta, False)
    (OUT / "guides").mkdir(parents=True, exist_ok=True)
    for rel in GUIDES:
        shutil.copyfile(ROOT / rel, OUT / "guides" / Path(rel).name)
    print(f"wrote site/data: {len(opps)} opportunities ({meta['counts']['inferredTags']} with inferred tags, "
          f"{meta['counts']['unverified']} unverified), {len(events)} events, {len(perks)} perks, {len(guides)} guides")


if __name__ == "__main__":
    main()
