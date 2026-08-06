# Design QA — Comparador mobile

- Source visual: `screenshots/comparator-option-1-mobile.png`
- Target viewport: 390 x 844 CSS px
- Published checkpoint: `https://marcuscapobiangomed-ai.github.io/pedaldata/comparar/`
- Build artifact: GitHub Pages run `31099476096`

## Implemented scope

- Compact horizontal selection shelf for two required bikes and one optional bike.
- Search kept visible while advanced filters collapse behind a mobile filter control.
- Catalog limited to ten initial cards with progressive `Mostrar mais` pagination.
- Two-column compact product grid below 600 px.
- Fixed bottom comparison bar after the first selection.
- Mobile comparison cards by criterion instead of a 720 px horizontal table.
- 44 px minimum remove target and larger filter input text.

## Automated evidence

- Full repository validation passed after the implementation.
- Production Jekyll artifact contains the new markup, CSS and JavaScript contracts.
- GitHub Pages build and deployment completed successfully.
- Published HTML exposes the comparator script, mobile selection bar and progressive catalog control.

## Visual comparison evidence

Real iPhone captures supplied by the user on 2026-08-06:

- `screenshots/comparator-mobile-01-one-selected.jpg`: one selected bike, disabled CTA and two empty slots.
- `screenshots/comparator-mobile-02-two-selected.jpg`: two selected bikes, enabled CTA and optional third slot.
- `screenshots/comparator-mobile-03-results.jpg`: three-bike comparison rendered as criterion cards without horizontal overflow.

The captures confirm the compact three-slot shelf, visible search, collapsed advanced filters, two-column catalog, fixed selection summary and mobile criterion cards. They also exposed a redundant fixed `Comparar 3` action over the completed result; the bar is now hidden when the result opens.

## Remaining verification gaps

- The captures prove the 1-, 2- and 3-bike visual states, but not keyboard, screen-reader or zoom behavior.
- Filter disclosure, search and `Mostrar mais` progression were not captured.
- Browser console warnings and errors cannot be checked from phone screenshots.

final result: passed with named interaction limits
