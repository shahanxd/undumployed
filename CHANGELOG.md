# Changelog

All notable changes to this collection. Dates are when the sweep was done.

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
