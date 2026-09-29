# Contributing

Every verified addition or correction helps someone not miss a deadline. Thank you.

---

## What we want

- **New opportunities** that aren't listed: internships, fellowships, scholarships, competitions, open-source programs, events, communities, student perks.
- **Deadline corrections** when a cycle opens or a date moves.
- **Dead links** replaced with the current official page.
- **Reality checks**: if your experience contradicts what an entry says, fix it.
- **Removals** of programs that are discontinued or no longer open to students.

## What we don't want

- Affiliate, referral, or tracking links of any kind.
- Anything you haven't verified on the **official** site in the last 30 days.
- Links to aggregators (Unstop, Internshala, Buddy4Study, etc.) in place of the official page. They're fine as "sources to watch" in guides, never as an entry's apply link.
- Paid "certificate internships", coaching companies, or courses dressed up as opportunities.
- Vague entries with no deadline, no eligibility, and no funding info.

---

## Repo layout

| Folder | What goes there |
|--------|-----------------|
| `internships/` | Paid or funded work + research placements. Split by research-india, research-global, tech-companies, finance-quant-consulting, government-and-non-tech. |
| `open-source/` | Paid open-source programs (GSoC, LFX, Outreachy, MLH, …). |
| `fellowships/` | Scholarships and fellowships: study-abroad, india, research-and-networking (forums, PhD fellowships, travel grants, summer schools). |
| `startups/` | Accelerators, talent investors, grants, government startup schemes. |
| `hackathons/` | Hackathons only. |
| `competitions/` | Competitive programming, case/business, science & research competitions, olympiads. |
| `events/` | Conferences, expos, festivals, college fests. Split by tech-global, research-conferences, india, arts-culture. |
| `communities/` | Student ambassador programs and brand insider/beta programs. |
| `student-perks/` | Free or discounted tools, credits, subscriptions, travel. |
| `guides/` | How-to material: application kit, cold email, visas, timeline by year, interviews. |
| `deadlines.md` | The master calendar, built from every file's At-a-glance table by `scripts/build_deadlines.py`. Don't edit it by hand; rerun the script. |

If something fits two places, put the full entry in one file and a short cross-reference in the other. Keep the cross-reference's `###` heading and tag line, add a sentence on why it matters there, and end with `Full entry: [file.md](../path/file.md#anchor).` in exactly that form. The website reads it, shows the program once, and lists it under both categories.

---

## Entry format

Every opportunity file has an **At a glance** table at the top and full entries below. Add a row to the table **and** a full entry.

**At a glance row:**

```markdown
| [Program Name](#program-name) | **Oct 15, 2026** | ✅ Stipend | 3rd-year UG, CS/EE | UG |
```

Deadline cell conventions: exact dates in bold (`**Oct 15, 2026**`), approximate windows with a tilde (`~Jan 2027`), `Rolling`, or `Next: ~Mar 2027` for a cycle that has passed. If unverified, use `⚠️ Unverified: ~Mar 2027`.

**Full entry:**

```markdown
### Program Name
> **Type:** Research Internship | **Location:** City, Country | **Funded:** ✅ CHF 2,900/month + travel

| Field | Details |
|-------|---------|
| Deadline | **Jan 25, 2027** (opens ~Nov 2026) |
| Duration | 8–13 weeks, Jun–Aug 2027 |
| Who | Concrete eligibility: year, field, citizenship, CGPA gates, age limits |
| Stipend | Amount + what's covered |
| Stage | UG / PG / PhD |

**What it is:** 2–4 sentences. What you actually do, what you get, why it matters.

**Reality check:** 1–3 sentences. Who realistically gets in, what trips people up, hidden gates (nomination, NOC, visa, faculty-first).

**Apply:** [domain.tld/path](https://full-official-url)

---
```

**The reality check is mandatory.** It's what makes this repo more useful than a list of links.

**Tag line (for the website's filters).** Right under the `### heading`, add one HTML comment (it's invisible on GitHub):

```markdown
### Program Name
<!-- tags: stage=ug,pg; field=cs,ai; region=europe; funding=stipend; citizenship=any; gates=faculty-first; format=in-person -->
```

Values to use for each key. `stage`: hs, ug, pg, phd, grad · `field`: cs, ai, ee, mech, civil, physics, math, chem, bio, med, design, business, econ, policy, law, humanities, media, edu, any · `region`: india, remote, europe, uk, north-america, east-asia, southeast-asia, middle-east, australia, global · `funding`: full, stipend, prize, free, unpaid, loan · `citizenship`: any, indian-only · `gates` (optional, comma-separated): nomination, faculty-first, campus-only, women-only, diversity, noc, team, age-limit, work-experience, enrolled-only, invite-only · `format`: in-person, remote, hybrid. If you skip the tag line, the site guesses from the text and labels the entry "tags inferred".

Events use a slightly different block (dates, location, access, cost, student angle, visa). Copy an existing one.

---

## How to submit

1. Fork, branch, edit the relevant file.
2. Open a PR with a title like `Add: KAUST VSRP` or `Fix: EPFL deadline → Nov 15`.
3. Paste the official URL you verified against in the PR body.
4. Maintainers review and merge. Small fixes are usually merged same week.

Not comfortable with git? Open an issue using the **New opportunity** or **Fix an entry** template and someone will add it.

---

## Maintenance cycle

Deadlines cluster in three waves. Before each one, someone sweeps the repo:

| Sweep | When | What to check |
|-------|------|---------------|
| Autumn | late Aug | Big Tech intern windows, fellowships closing Oct–Jan, EF/YC batches, GSoC-adjacent prep |
| Winter | early Dec | IIT/IISc summer programs, CERN/ETH/EPFL, Erasmus, Inlaks/JN Tata, spring hackathons |
| Spring | early Mar | GSoC, summer schools, Reliance/Aditya Birla scholarships, YIF/TFI/LAMP, events for the year |

During a sweep: update the At-a-glance tables, run `python scripts/build_deadlines.py` and `python scripts/build_site_data.py`, bump the "Last verified" line in each file, and log it in `CHANGELOG.md`. CI fails a PR if the generated files are stale or an internal link is broken; a monthly Action checks external links and opens an issue if anything breaks. The website deploys itself from `master`.

---

## Questions

Open an issue. If a program has messy eligibility that doesn't fit the format, describe it plainly in the entry rather than forcing it into the table.
