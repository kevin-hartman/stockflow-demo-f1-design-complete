# StockFlow Design Guide

Token source of truth: `design-guide.json` (rendered to `client/src/styles/theme.css` by `consort-apply-design-theme`); component classes live in `client/src/styles/global.css`.

**Provenance (browsed 2026-10-28):** DM Sans, navy `#1B3139` text, sharp 0px CTAs — observed on databricks.com. Warm-oat `#F9F7F4` page surface, uppercase compact CTA — observed on brand.databricks.com. Calm white card + table layout — observed on cin7.com. Dense, light-grey scannable listings — observed on fishbowlinventory.com. Soft rounded containers + generous whitespace — observed on linnworks.com. Full token values adopted from the PO's token theme (`.consort/intake/answers.md`).

## Design Philosophy

- Calm and scannable: SKUs and quantities readable at a glance on a rugged tablet.
- Touch-first: every interactive target ≥ `--tap-target` (44px).
- Every state explicit: empty, loading, success, validation error — never a blank region.
- Brand red is reserved for the primary action and the active link.
- Meaning never by color alone; status/success/error always carry text.
- Voice: "StockFlow: warehouse operations, batched and barcoded, on one Postgres." Plain, guiding headings and empty states.

## UI Framework and Templating

React + TypeScript SPA under `client/`, client-side routed (no full-page reloads); stock changes update rows in place. Components render from typed props — no hand-assembled HTML strings. Stable test seams: `data-testid` on every screen root, table row, form field, toast, scan zone, and status badge; semantic roles (`role="alert"`, `aria-live`) for feedback. Rendering lives in the boundary (components/pages); data in hooks/services. Framework specifics are the Architect's.

## Typography

- UI: `--font-sans` DM Sans; numerics/codes: `--font-mono` DM Mono with `tabular-nums`.
- Scale: `--text-xs` 10, `--text-sm` 13, `--text-base` 15, `--text-md` 16, `--text-lg` 20, `--text-xl` 24, `--text-xxl` 29 (px).
- Line heights: body 1.5, heading 1.25, tight 1.1. Weights: 400 / 500 / 600 / 700.

## Color Palette

- Brand: `--color-brand` #FF3621 (hover #EB1600, light 8%); navy 900 #1B3139, 700 #1B5162, 500 #618794, 400 #90A5B1, 300 #C4CCD6, 200 #E5EAF1, 100 #EDF2F8.
- Semantic: success #2E844A, warning #FFAB00, info #0176D3, error = brand red; each with a `-light` fill.
- Surface: page #F9F7F4 (warm oat), card #FFFFFF, cool #F0F2F5 (table header).
- Text: primary #1B3139, secondary #1B5162, tertiary #618794, disabled #90A5B1, inverse #FFFFFF.

## Spacing

4px grid: `--space-0` 0, `-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32, `-10` 40, `-12` 48. Layout: content 960px, narrow 560px, navbar 64px, tap target 44px, border 1px / accent 2px, focus ring 2px, hover lift −2px; icons 16 / 24 / brand 32 / empty 48.
Radius: none 0, sm 4, md 8, lg 12, xl 15, pill 999. Shadows: sm, md, lg, navbar (navy-tinted). Breakpoints: mobile 480, tablet 768, desktop 1024. Motion: fast 0.15s, base 0.2s, toast-dismiss 3s.

## Components

| Component | Class | Rules |
|---|---|---|
| Navbar | `navbar` | navy 64px, 2px brand-red bottom border; `navbar__brand` (`navbar__icon` + "StockFlow") left, `navbar__links` right, `navbar__link--active` brand red |
| App icon | `navbar__icon` / `page__icon` | warehouse.png, 32px |
| Page | `page`, `page--narrow` | warm oat, 960px column (560px narrow for detail + forms); `page__header`, `page__title`, `page__subtitle` |
| Card | `card` | white, radius-lg, shadow-sm, hover lift → shadow-md; `card__title` |
| Button | `btn` | `btn--primary` (solid brand, radius 0), `btn--secondary` (navy-200 outline), `btn--ghost`, `btn--danger`, `btn--danger-outline`, `btn--sm`; in-flight: disabled + `btn__spinner` |
| Form | `form` | single narrow column; `form__actions` |
| Form field | `field` | persistent `field__label`, `field__input` (info focus ring), `field__hint`, `field--error` + `field__error` naming the field |
| Stock table | `stock-table` | cool uppercase header; `stock-table__num` right-aligned mono tabular; `stock-table__row--flash` on in-place update |
| Status badge | `badge` | pill, xs uppercase, text always: `badge--in-stock`, `badge--low`, `badge--out`, `badge--on-order`, `badge--quarantined`, `badge--not-tracked` |
| Detail list | `detail-list` | SKU key/values; `detail-list__value--muted` shows "not tracked" |
| Empty state | `empty-state` | icon + `empty-state__title` + `empty-state__body` + CTA |
| Loading | `loading` | spinner + "Loading…", `aria-busy` |
| Alert | `alert` | `alert--error/success/info`, `role="alert"`; page-load + validation only |
| Toast | `toast` in `toast-region` | fixed top-right; `toast--success` auto-dismisses 3s, `toast--error` persists with close |
| Scan zone | `scan-zone` | dashed card, large mono input; `scan-zone--success` green flash, `scan-zone--error` red flash |
| Confirmation | `confirmation` | success icon + heading + summary + next actions |
| Icon | `icon` | `icon--sm`, `icon--md` |

## Iconography

- App icon / favicon: `.consort/design/assets/warehouse.png` → `client/public/warehouse.png`; rendered as `navbar__icon` beside "StockFlow" and as `index.html <link rel="icon" href="/warehouse.png">`. Not the scaffold `favicon.svg`.
- One line-style set (Lucide, `currentColor` stroke): inbound (`arrow-down-to-line`), outbound (`arrow-up-from-line`), scan (`scan-barcode`), warehouse (`warehouse`), search (`search`), stock states (`check-circle` in-stock, `alert-triangle` low, `x-circle` out, `clock` on-order, `shield-alert` quarantined, `minus-circle` not-tracked). No mixed styles.

## User Feedback Principles

No silent failure, no unacknowledged success. All errors go through `describeError()` (status code → actionable text incl. the code). Optimistic updates revert on failure. Feedback never shifts layout.

| Action | Success | Failure |
|---|---|---|
| Form submit | confirmation view | inline `alert` + field-named `field__error` |
| Barcode scan | row updates in place + `scan-zone--success` | `scan-zone--error` + persistent error toast |
| Inline mutation | success toast (3s) | persistent error toast |
| Delete / remove | success toast + optimistic update | persistent toast + local revert |
| Page load | — | inline alert replaces content |
| Button action | disabled + spinner | re-enabled + error shown |

## Adherence contract (E2E / Playwright)

`assertDesignAdherence` (`:root` vs this JSON), `checkHardcodedValues`, `checkRequiredSeams` (ia.md test ids), `checkFeedbackPresent`, `checkRouteReachability`, `checkTokenConsumption`. Violations raise a blocking `ux-adherence` smell.
