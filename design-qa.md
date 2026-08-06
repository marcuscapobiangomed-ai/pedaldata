# Design QA — Comparador de bicicletas

- Source visual truth: `C:/Users/marcu/.codex/generated_images/019fd426-6ec1-7313-be30-43cc2e001019/exec-50c382b2-7989-4350-b83b-32d2a8bcb491.png`
- Implementation screenshots: `screenshots/comparator-option-1-empty-desktop.png`, `screenshots/comparator-option-1-comparison-desktop.png` and `screenshots/comparator-option-1-mobile.png`
- Combined comparison: `screenshots/comparator-option-1-side-by-side.png`
- Target viewport: 1440 x 1024 CSS px
- Source pixels: 1488 x 1058
- Implementation pixels: 1440 x 1024 desktop and 390 x 844 mobile
- State: empty selection, completed three-bike comparison, filtered catalog and responsive entry view

## Full-view comparison evidence

The side-by-side evidence compares the generated option 1 with the published implementation at equivalent desktop scale. The implementation preserves the chosen editorial composition: TheBiker masthead, black trust banner, three comparison slots, compact filter row, six real product cards and the brand's red/black/white palette. It deliberately retains the existing site's navigation and typography tokens.

## Focused region comparison evidence

- Selection shelf: three visible slots, with two required and one optional.
- Catalog: six verified models with official product images, year, category and observed price.
- Filters: category filter reduced the catalog from six to three MTB models and returned to all models.
- Comparison table: three selected models rendered with row and column headers, highlighted differences and responsible-data note.
- Responsive view: at 390 x 844 the masthead, trust data, heading and first selection slot remain legible without horizontal overflow.

## Findings and fixes

- [P1] The original public catalog exposed only three bikes.
  - Fix: expanded the public catalog to six models verified against official TheBiker/manufacturer information, including three Spark RC models.
- [P2] Technical values appeared in raw English and provisional groupset/brake text appeared as if confirmed.
  - Fix: localized carbon, shifting and brake values; provisional or unconfirmed values now render as `Não informado`.
- [P2] The comparison used smooth scrolling, which produced unstable stitched captures and could delay focus on the result.
  - Fix: changed the result transition to immediate scrolling while preserving focus.
- [P1] The published HTML could reuse a stale comparator script from browser cache.
  - Fix: added an explicit script version so the current comparator loads immediately.

## Comparison history

### Pass 0

- Finding: local HTTP previews were blocked by the available in-app browser.
- Fix: used the explicitly authorized GitHub Pages deployment as the browser-rendered checkpoint.

### Pass 1

- Finding: published interaction worked, but raw English values and unconfirmed technical text remained in the table.
- Fix: normalized labels and fail-closed display values; full repository validation passed.

### Pass 2

- Finding: browser cache retained the previous JavaScript after deployment.
- Fix: versioned the script URL, redeployed and repeated the browser test successfully.

## Primary interactions tested

- Loaded all six verified catalog cards and product images.
- Filtered by `MTB cross-country`, confirming three results.
- Selected Addict 50, Addict RC 20 Di2 and Spark RC Expert.
- Confirmed the enabled CTA `Comparar 3 bicicletas selecionadas` and the three-bike ready status.
- Opened the completed comparison and verified localized values plus honest `Não informado` fallbacks.
- Captured desktop and mobile responsive states.

## Console errors checked

The published flow returned no browser console warnings or errors during the tested journey.

## Follow-up polish

No blocking or material visual mismatch remains. Future catalog expansion can reuse the same card and comparison contracts without changing this layout.

final result: passed
