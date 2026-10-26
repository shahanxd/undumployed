# Changelog

All notable changes to this collection. Dates are when the sweep was done.

## 2026-10-26: October sweep, Drops

**Drops: one-off opportunities**
- New [drops.md](drops.md) for one-off and limited-edition opportunities (a lab's first hackathon, a sponsored Kaggle competition). Each drop is a normal entry in its category file, tagged `edition=one-off` with an `expires` date, so it also shows under its category. `scripts/build_drops.py` generates the list and CI checks it.
- A quality bar in [CONTRIBUTING.md](CONTRIBUTING.md#drops-one-off-opportunities) keeps it from filling with filler: free to enter, an official page with dates and eligibility, open to students in India, a named organiser, plus at least two signals (a known backer, ≥$5k / ₹2L in prizes, credits/interviews/travel, recognisable mentors, a good track record).
- First drops: Lexsi AI Safety & Alignment Hackathon (with Cohere Labs and Hugging Face), Meta VR Start Developer Competition 2026 and Google DeepMind's Gemma 4 Developer Agent Competition on Kaggle.
- [sources/watchlist.md](sources/watchlist.md) lists where we look for them; a "Spotted a drop" issue template lets anyone send one in.
- Website: a Drop badge, a "One-off drops" filter, a Drops strip on the home page; drops hide themselves once they expire.

**Sweep**
- Every deadline that passed since Sep 29 was rolled to its next cycle, and windows that have since opened got their real dates: UGC-NET (Oct 28), CSIR-NET (Nov 5), NVIDIA Graduate Fellowship (Oct 30), IEEEXtreme (Oct 28), ZIO (Nov 21), speedrun SR008 (Nov 1), Twilio Champions (open to Feb 28), Imagine Cup 2027 and TreeHacks 2027 (open now), among others.
- New recurring entries: Apart Research AI-safety sprints, and hackaTUM, HackUPC and START Hack for the thin Europe hackathon section.
- 14 past events rolled to their 2027 editions (IROS 2027 Florence, IAC 2027 Poznań and more); two 2026 entries dropped because their 2027 entry already existed.
- Removed after two or more years without an edition, or with a dead official page: CSIR Innovation Award for School Children, KPMG Ideation Challenge, Mahindra War Room, Glow & Lovely Foundation Scholarship, Google Research India AI Summer School, FOSSASIA Codeheat, Twitch Ambassador, plus the one-off Figma Config India. Each is in its file's removed/defunct table. Khorana Program and Meta Hacker Cup are marked paused/unannounced rather than removed.
- Entries still marked ⚠️ unverified: 56 (from 61).

## 2026-09-29: Verification pass, tags, website

- Every entry flagged ⚠️ in the rebuild was re-checked against its official source. Each proposed fix was challenged by a second, independent check before it went in, and every file was audited for contradictions, stale dates and broken formatting. Entries still marked unverified went from more than 140 to 61.
- Programs that ended, became paid-only or closed to students in India were removed. Each file's "Removed this cycle" section says what went and why.
- A program listed in two files now has one full entry and a short cross-reference, and the website shows it once, under both categories.
- Corporate hackathons link to their official registration pages instead of Unstop search results. Flipkart GRiD and Myntra HackerRamp now run on MyCareernet.
- The writing was edited into plainer language: long dashes and stock phrases were replaced, and a second reader checked every rewritten line for changes in meaning. Headings written "X — Y" now read "X: Y", and every link to them was updated.
- Facet tag lines (`<!-- tags: … -->`) added under every entry heading so the site can filter by stage, field, region, funding, gates and format.
- New static website in `site/`: search with dropdown filters, a month-by-month deadlines page, events, perks, guides, and saved items with calendar export. Built from the markdown by `scripts/build_site_data.py` and deployed on Vercel. The home page opens on a hand-drawn Arcadia Bay: as you scroll, the sun sets, the lighthouse comes on and a storm rolls in.
- CI now also checks `site/data` freshness and internal links.

## 2026-09-29: Full rebuild

**Structure**
- Split `internships/` into research-india, research-global, tech-companies, finance-quant-consulting, government-and-non-tech.
- New top-level folders: `open-source/`, `competitions/`, `communities/` (replaces `insider-programs/`), `student-perks/`, `startups/` (replaces `startup-programs/`).
- `fellowships/global.md` → `fellowships/study-abroad.md`; new `fellowships/research-and-networking.md` (forums, PhD fellowships, travel grants, summer schools, AI-safety programs).
- `events/` split into tech-global, research-conferences, india, arts-culture. Visa table moved to `guides/visas-for-indian-passport.md`.
- New guides: timeline-by-year, visas-for-indian-passport, interviews-and-tests.
- Added GitHub issue/PR templates and a monthly link-check workflow.

**Content**
- Every entry re-verified against official sources for the 2026–27 cycle. Passed deadlines (Schwarzman, Mitacs Globalink, Jane Street SEE India, DEF CON 34, Gamescom, IFA, Tokyo Game Show, Ars Electronica, Ziro, Venice, TIFF, Tomorrowland, Tour de France, Burning Man, Farnborough, HackMIT, etc.) rolled to their next edition.
- Roughly 5× more entries. New coverage: government & policy internships, econ/RA roles, law, journalism, design, social-sector fellowships, Indian state startup grants, school-level scholarships, women-in-tech programs, student design awards, college fests, conference travel grants, PhD fellowships, ambassador programs, and free student perks.
- Discontinued programs removed or marked (see each file's report line).

## 2026-08: Initial collection

- First public version: ~120 entries across fellowships, internships, hackathons, events, insider programs, startup programs, and two guides.
