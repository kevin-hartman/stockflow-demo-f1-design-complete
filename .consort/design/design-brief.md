---
author: Product Owner
---

# Design brief (StockFlow)

The Product Owner's design intent for the StockFlow UI, the UX
Designer's intake. The surface is small: a home stock-by-location view,
a SKU detail page, receipt / pick / adjustment (and later cycle-count)
forms, and barcode scanning as the primary floor input. Users are
warehouse operators on rugged tablets, so calm, scannable, touch-sized,
and explicit about every state.

## UI delivery

StockFlow is a single-page application: a React + TypeScript client
under `client/`, talking to a JSON API. Screens are client-side routed
(home, SKU detail, forms) with no full-page reloads; a stock change
updates its row in place. Every state (empty, loading, success,
validation error) is an explicit component state. The framework choice
itself is the Architect's to record.

## References

- **Databricks brand / design system** (https://www.databricks.com,
  https://brand.databricks.com): take BRAND and COLOR. DM Sans
  typography, navy-900 `#1B3139` text, warm-oat `#F9F7F4` page
  background, white cards, brand red `#FF3621` for primary actions only.
- **Warehouse / inventory dashboards** (Cin7 https://www.cin7.com,
  Fishbowl https://www.fishbowlinventory.com, Linnworks
  https://www.linnworks.com, the card-and-table view): take LAYOUT and
  INFORMATION DENSITY. A calm, scannable stock-by-location table on the
  home page, generous whitespace, right-aligned numeric columns with
  tabular figures, and a single narrow column for the detail page and
  forms.

## Brand constraints

- **Color:** navy `#1B3139` text, warm-oat `#F9F7F4` page surface, white
  cards, brand red `#FF3621` for the primary action / accent only
  (Receive, Pick, Save, the active link). The stock table stays calm and
  high-contrast so SKUs and quantities are easy to scan.
- **Semantic color:** success `#2E844A`, warning `#FFAB00`, info
  `#0176D3`, error = brand red. Meaning is always carried by text as
  well, never color alone.
- **Typography:** DM Sans for UI, DM Mono for code / numerics. No custom
  web font beyond what the theme loads.
- **Spacing:** 4px base grid (`--space-1` .. `--space-12`).
- **Shape:** soft containers (`--radius-lg` white cards with a soft
  navy-tinted shadow on warm-oat), sharp primary CTA (solid brand red,
  `border-radius: 0`, a Databricks signature). Consistent across home,
  detail, and forms.
- **App icon (required):** a warehouse mark, staged with this brief at
  `.consort/design/assets/warehouse.png`. It must actually render as the
  navbar brand image next to "StockFlow" and as the browser favicon
  (`index.html <link rel="icon">`); a placeholder or the scaffold
  `favicon.svg` does not meet this. The UX Designer declares it in
  `design-guide.json` `app_icon` (`source` =
  `.consort/design/assets/warehouse.png`, `install_to` =
  `client/public/warehouse.png`).
- **Icon set:** one line-style icon set used consistently (inbound /
  outbound, scan, warehouse, search, stock-level states); no mixed
  styles.
- **Voice:** "StockFlow: warehouse operations, batched and barcoded, on
  one Postgres." Headings and empty states use a plain, guiding voice.

### Token theme to leverage

The human supplied a materialized token theme (full set in
`.consort/intake/answers.md`); the UX Designer adopts it as the token
baseline. Key values:

```css
:root {
  --font-sans: 'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --text-sm: 13px; --text-base: 15px; --text-lg: 20px; --text-xl: 24px; --text-xxl: 29px;
  --color-brand: #FF3621; --color-brand-hover: #EB1600; --color-brand-light: rgba(255,54,33,0.08);
  --color-navy-900: #1B3139; --color-navy-700: #1B5162; --color-navy-500: #618794;
  --color-navy-200: #E5EAF1; --color-navy-100: #EDF2F8;
  --color-success: #2E844A; --color-warning: #FFAB00; --color-info: #0176D3; --color-error: #FF3621;
  --color-card: #FFFFFF; --color-page: #F9F7F4; --color-cool: #F0F2F5;
  --space-1: 4px; --space-2: 8px; --space-4: 16px; --space-6: 24px; --space-12: 48px;
  --content-max-width: 960px; --narrow-max-width: 560px; --navbar-height: 64px;
  --tap-target: 44px; --focus-ring: 2px; --border-accent: 2px;
  --radius-none: 0px; --radius-lg: 12px; --radius-pill: 999px;
  --shadow-sm: 0 2px 8px rgba(27,49,57,0.06); --shadow-md: 0 4px 16px rgba(27,49,57,0.08);
  --shadow-navbar: 0 2px 12px rgba(27,49,57,0.24);
  --transition-fast: 0.15s ease; --toast-dismiss: 3s;
}
```

## Interaction constraints

- **Every state is explicit:** an empty location shows "No stock at this
  location — receive an inbound shipment", never a blank page; a SKU
  with no batch / serial detail shows "not tracked", never a blank
  region.
- **Forms never fail silently:** a successful save lands on a
  confirmation view (or an inline green flash for an adjustment); a
  validation problem (a pick that would overcommit, an unknown SKU) is
  shown inline next to the field, naming it.
- **Barcode scan is the primary floor input:** success = green scan-zone
  flash + the stock row updating in place; failure (unknown barcode,
  locked SKU) = red scan-zone flash + a persistent toast.
- Home grid and detail page are read-mostly; the no-silent-failure rule
  applies to the receipt, pick, adjustment, and cycle-count forms.

### Feedback matrix

| Action | Success | Failure |
|---|---|---|
| Form submit | navigate to a confirmation view | inline alert + field-named error |
| Barcode scan | row updates in place + green scan-zone flash | red scan-zone flash + persistent error toast |
| Inline mutation (adjust, status change) | auto-dismiss success toast (~3s) | persistent error toast |
| Delete / remove | success toast + optimistic update | persistent toast + local revert |
| Page load | n/a | inline alert replaces the content area |
| Button action | disabled + spinner while in flight | re-enabled + error shown |

All errors route through a single `describeError()` helper that maps
status codes to actionable text including the code. Optimistic updates
revert on failure. Feedback never shifts layout: toasts are
fixed-position; inline alerts are reserved for page load and validation.

### Component vocabulary

Every screen composes this named set (emitted in `design-guide.json`
`components`):

- **Navbar:** navy 64px top bar, 2px brand-red bottom border; app icon +
  "StockFlow" left, nav links right, active link in brand red.
- **Page:** warm-oat background, centered ~960px column, `page__header`
  with title + app icon; a narrow 560px variant for detail and forms.
- **Card:** white, soft navy-tinted shadow, gentle radius, subtle hover
  lift; the stock table and detail panels live in cards.
- **Buttons:** primary (solid brand red, sharp corners), secondary
  (outlined navy-200), ghost, danger, danger-outline, and a `--sm` size;
  minimum 44px tap target.
- **Form inputs:** persistent visible labels (never placeholder-only),
  info-color focus ring, explicit error state (error border +
  error-light fill) with an inline field-named message.
- **Stock table:** cool uppercase header row; right-aligned quantities in
  mono / tabular figures; in-place row flash on update.
- **Status pills:** in-stock / low / out / on-order / quarantined /
  not-tracked, meaning carried by both text and color.
- **Empty state:** icon + teaching heading + copy + CTA.
- **Toasts:** fixed top-right; success auto-dismisses, error persists.

## Accessibility constraints

- Touch targets at least 44px (`--tap-target`) for warehouse-floor
  tablet use.
- Meaning never by color alone: status, success, and error always carry
  text.
- Persistent visible labels on every input; a visible focus ring.
- High-contrast navy-on-white / warm-oat text; the stock table stays
  calm and readable at a glance.
- Errors name the field that caused them and say how to fix it.
