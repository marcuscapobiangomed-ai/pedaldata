# Design QA — Imagens dos cards do comparador mobile

- Source visual truth: `screenshots/comparator-card-overlap-source-01.jpg` and `screenshots/comparator-card-overlap-source-02.jpg`
- Implementation URL: `https://marcuscapobiangomed-ai.github.io/pedaldata/comparar/`
- Implementation screenshot: unavailable; no browser surface is connected in this session
- Source pixels: 591 x 1280 px per iPhone capture
- Target CSS viewport: approximately 390 px wide mobile viewport
- Density normalization: not performed because the revised rendered capture is unavailable
- State: catalog grid with mixed portrait, landscape and transparent product images

## Findings and comparison history

- P1 — Product images with tall intrinsic proportions expanded their flex item beyond the intended mobile image rail, causing title, metadata and price to overlap the image.
  - Evidence: the source captures show overlap on Oggi Cattura Sport, Scott Spark RC World Cup and Oggi Razzo T 110.
  - Fix applied: `.catalog-image` now has fixed flex bases of 126 px on desktop and 92 px on mobile, `min-height: 0` and `overflow: hidden`; child images have explicit block sizing and zero intrinsic minimums while retaining `object-fit: contain`.
  - Cache control: the global stylesheet URL was advanced to `style.css?v=7`.
  - Post-fix visual evidence: blocked because the in-app Browser and external browser surfaces are unavailable.

## Required fidelity surfaces

- Fonts and typography: unchanged; the fix prevents product titles from occupying the image rail.
- Spacing and layout rhythm: image rails now have deterministic heights across every card.
- Colors and visual tokens: unchanged.
- Image quality and asset fidelity: original product assets remain in use with `object-fit: contain`; excess intrinsic size is constrained without stretching.
- Copy and content: unchanged.

## Primary interactions and console

- Repository validation: passed.
- GitHub Pages deployment for commit `40a8a5c`: passed.
- Production HTTP and CSS v7 contract: passed.
- Browser interaction and console checks: blocked because no browser surface is connected.

## Remaining blocker

A fresh rendered mobile screenshot of the mixed-image catalog is required to confirm that no visual overlap remains. Code, build and production checks do not replace that visual evidence.

final result: blocked
