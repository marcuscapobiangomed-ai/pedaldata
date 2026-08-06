# Design QA — Comparador mobile

- Source visual: `screenshots/comparator-option-1-mobile.png`
- Target viewport: 390 x 844 CSS px
- Published checkpoint: `https://marcuscapobiangomed-ai.github.io/pedaldata/comparar/?v=6a9a252-final`
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
- Published HTML exposes the v4 comparator script, mobile selection bar and progressive catalog control.

## Visual comparison evidence

Blocked. The Codex in-app browser and Chrome surface are unavailable in this session, so a current rendered mobile screenshot could not be captured and compared with the source image. HTTP checks and deployment success do not replace visual verification.

## Interaction verification gaps

- Confirm the compact slots at 390 x 844.
- Confirm filter disclosure, ten-card initial limit and `Mostrar mais` progression.
- Confirm first and second selections update the fixed bar and enable its CTA.
- Confirm completed comparison renders criterion cards without horizontal overflow.
- Check browser console warnings and errors during the full flow.

final result: blocked
