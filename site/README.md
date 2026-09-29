# The website

A static front end for the list. No framework and no build step: it reads JSON generated from the markdown, so the markdown stays the single source of truth.

**Live:** https://undumployed.vercel.app/ (Vercel deploys every push to `master`; `vercel.json` at the repo root serves this folder as-is, with no build step).

## Run it locally

```bash
python scripts/build_site_data.py   # markdown -> site/data/*.json, plus copies of the guides
python scripts/serve.py             # then open http://127.0.0.1:8000
```

It has to be served over http (ES modules and `fetch`); opening `index.html` straight from disk won't load the data. Use `scripts/serve.py` rather than `python -m http.server`: the built-in server only queues five connections, and when a browser fetches all the modules at once, Windows refuses the rest and the page comes up blank. `serve.py` also turns off caching, so a reload always shows your latest edit.

Vercel tells browsers to check for a fresh copy of every file on each visit, so a visitor never mixes old and new code after a deploy. If you host it somewhere that caches files for longer, run `scripts/stamp_version.py` on the deployed copy to add a version to every CSS and JS URL. If a file still fails to arrive, the page says so and offers a reload instead of staying empty.

## How it fits together

| Piece | What it does |
|-------|--------------|
| `scripts/build_site_data.py` | Turns every entry (its `### heading` block and its At-a-glance row) into `data/opportunities.json`, events into `data/events.json`, perk tables into `data/perks.json`, and copies the guides into `data/guides/`. A program listed in two files is shown once: the short cross-reference ("Full entry: …") is folded into the full entry, which then also appears under the cross-reference's category, and the old link still opens it. |
| `<!-- tags: … -->` under each heading | The facets the filters use: stage, field, region, funding, citizenship, gates, format. The vocabulary lives in `build_site_data.py`. |
| `js/filters.js` | The filter engine and facet counts. Pure functions, tested by `js/filters.test.mjs` (`npm test` inside `site/`). |
| `js/data.js` | Loads the JSON once and works out each deadline's state in the browser, so a confirmed date that has passed shows as closed without a rebuild. |
| `js/landing.js`, `browse.js`, `deadlines.js`, `events.js`, `perks.js`, `guides.js`, `saved.js` | One module per page. Each mounts into a fresh `<main>`. The URL hash carries all state, so every view can be linked. |
| `js/menus.js` | The filter dropdowns. Native Popover API, with a small fallback. They become bottom sheets on phones. |
| `js/drawer.js` | The detail panel: official link, save, add to calendar, copy link, report a problem. Keeps focus inside while open and returns it on close. |
| `js/hero.js`, `css/hero.css` | The bay (see below). |
| `css/tokens.css` | Colours and type for the two themes: golden (light) and storm (dark). |

`js/vendor/marked.min.js` (MIT) renders the guides.

## Design notes

The list comes first: plain rows with the deadline on the left, and the detail in a side panel. Filters are dropdowns with live counts. Type is Newsreader for titles and Schibsted Grotesk for everything you scan.

The Life is Strange part is kept to a few places where it earns its keep:

- **The bay.** The home page opens on Arcadia Bay an hour before sunset, drawn by hand in SVG. It has the headland, the lighthouse, the bench, the firs, the town across the water, and sunlight broken on the sea. The scene holds still for the first stretch of scrolling, and that stretch is the evening: the sun goes down, the lamp flickers on and its beam starts turning, the town lights and the stars come out, then storm clouds roll in. Scrolling up rewinds it. Each layer only ever changes `transform` or `opacity`, so the compositor does the work. It stops when it's off screen. With reduced motion it neither holds nor moves. It shows one still frame instead, just after sunset, with the lamp already lit.
- **The blue morpho.** It's the logo. It folds its wings once when you hover it.
- **"This action will have consequences."** When you save something, that line appears with the butterfly, the way the game marks a choice.
- **Storm.** Dark mode is the same bay after nightfall.

## Checks

- `python scripts/build_site_data.py --check` fails if `site/data` is out of date with the markdown. CI runs it.
- `npm test` inside `site/` runs the filter engine tests.
- Checked with Playwright at 1440px and 390px in both themes, and with axe-core. No console errors, no horizontal overflow, and no accessibility violations. Filters, search, the detail panel (open, save, close with Esc, focus return), deep links, the `/` shortcut and calendar export were all exercised.
