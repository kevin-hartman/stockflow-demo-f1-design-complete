# Intake Answers

## Domain and name

- **Product name:** StockFlow
- **What it is + who uses it (1–2 sentences):** A warehouse-management application for a mid-market warehouse operation that has outgrown spreadsheets / a shared Excel file but for whom an enterprise WMS is overpriced and overwrought. Users: the warehouse-floor people who scan goods in, put them on shelves, pick them off shelves, count them, and ship them; the inventory manager who reconciles what the system says against what the shelves actually hold; and the operations lead who needs to know whether today's orders are going to ship.

## Product overview

- **Core jobs the users need to accomplish:**
  - Know what they have, in what quantity, at which physical location, at any point in time.
  - Receive inbound goods from a supplier and put them somewhere recoverable.
  - Pick goods off the shelf for a customer order without overcommitting what is actually there.
  - Count what is on the shelf, and reconcile that count with what the system says is here.
  - Operate across multiple warehouses without each one needing its own copy of the system.
- **First usable version vs. what comes later:** V1 (the first runnable increment that goes into use) is the simplest thing that lets the team see and adjust stock at one warehouse:
  - File, retrieve, and adjust the stock level of one SKU at one location.
  - Hold stock for the same SKU at multiple locations within one warehouse.
  - Record inbound receipts: a known supplier delivers a known quantity, and stock goes up at a chosen location.
  - Record outbound picks: a customer order draws stock down at a chosen location, with the system refusing to overcommit what is actually there.
  - Each unit is identified by a single tracking code that encodes location, batch, and serial together. The team is fine with this for V1; later iterations will revisit whether those fields should be split apart.
  - Everything beyond V1 is open.
  - Delivery mechanism: StockFlow is a modern single-page web application — a React TypeScript client the warehouse-floor tablet loads once and navigates without page reloads, backed by a JSON API. The operator experience (scan, adjust, and watch the stock row move in place) is a rich client-side interaction, not server-rendered form-submit round-trips.
- **Expected growth over the next few iterations:** The Product Owner expects to revisit and extend this overview between iterations once V1 is in real use. Likely later directions: full multi-warehouse operation, and splitting the single tracking code into separate location / batch / serial fields.
- **Explicit non-goals / out of scope:**
  - Not a production-grade WMS — no slotting optimization, labor management, yard management, or advanced forecasting (the Manhattan / Blue Yonder feature set).
  - No carrier-rate shopping, no label printing, no shipping integration beyond a manual tracking-number field.
  - No native mobile app — the operator uses a browser on a rugged tablet or a barcode scanner with a browser.
  - No accounting integration, no general-ledger postings, no invoicing.
  - No multi-tenant isolation across customer companies. One tenant per deployment.
- **What you want to see after each sprint (delivery expectations):** Working software I can actually use — not designs, stubs, or partial scaffolding. Every iteration must land as something runnable and demonstrable before the next one starts; that working increment is what I review to decide what the next sprint should be. A warehouse operator should be able to scan a real barcode and see the stock level in real time before I sign off.

## Non-functional requirements

### Required (hard-block if uncovered)

- **R1:** Existing stock data survives every schema migration with no loss. Each iteration's additive model change preserves the inventory records created before it, and every inventory adjustment keeps an unmodifiable timestamp and actor.
- **R2:** Stock levels never go below zero, and never overcommit beyond available quantity. A pick that would overcommit is rejected at write time (never a stored negative, never a silently-allowed double-allocation).
- **R3:** Every SKU at every location is uniquely addressable by `(sku, location)` and no two records share that pair. A collision is resolved at write time (never two stored duplicates, never an error page).
- **R4:** Integration tests run against the paired Lakebase branch, not a mock or in-memory substitute. The CI workflow refuses to merge a PR whose integration tests do not run against a real branch.
- **R5:** The UI is a single-page web application. The warehouse-floor tablet loads the app once and navigates client-side (home, SKU detail, the receipt / pick / adjustment forms) with no full-page reloads; a stock adjustment updates the affected row in place (optimistic update, reconciled against the server response) rather than re-rendering the page. The client is a React + TypeScript application under `client/`, and the backend is a JSON API (the boundary layer returns data, not server-rendered HTML). The client ships its own component tests; the API is covered by the branch integration tests in R4.

### By category

- **Performance (latency / throughput targets):** Barcode-scan interactions feel immediate — perceived response under ~200ms from scan event to UI update.
- **Scalability (data + concurrency growth):** No specific target for V1. Explicitly out of bounds: no caching layer, no multi-region concerns, no real-time multi-operator conflict resolution beyond the simple no-overcommit rule (R2).
- **Security (authn/authz, data sensitivity, audit):** No authentication, authorization, or per-tenant ownership for V1. Audit: every inventory adjustment keeps an unmodifiable timestamp and actor (R1).
- **Observability (what must be logged / measurable):** Each inventory adjustment records an immutable timestamp + actor (R1). Validation messages are clear and specific, naming the offending field (not just "bad request").
- **Operability (deploy, config, runbook expectations):** Migrations are additive where possible — reads keep working during rollout; a new column or table never breaks an existing page. Environment constraint (below) governs the DB connection.
- **Resilience (failure modes that must degrade gracefully):** The no-overcommit guard never double-allocates or stores a negative (R2); `(sku, location)` collisions resolve at write time, never an error page (R3). A stock-level row missing optional detail still renders cleanly — par level, batch, serial default to empty and show an explicit "not tracked", never a null crash or a blank region.
- **Anything the architect should explicitly NOT pursue:**
  - No authentication, authorization, or per-tenant ownership for V1.
  - No caching layer or multi-region concerns.
  - No real-time multi-operator conflict resolution beyond the simple no-overcommit rule.
  - **Environment constraint:** The app connects to the substrate-provisioned `databricks_postgres` database via the `DATABASE_URL` the post-checkout hook writes from the paired Lakebase branch. Do NOT rename the database or set `DB_NAME` / `PGDATABASE` to an app-specific name, and do not make the database name a requirement or NFR: the branch provisions only `databricks_postgres` (a migration creates tables, not databases), so an app pointed at any other name cannot connect. Leave the scaffold's connection defaults alone; the schema lives in `databricks_postgres` on the paired branch.

## Design brief (UI track only)

- **Reference site 1 — URL + what to take from it:** The **Databricks brand / design system** (https://www.databricks.com, https://brand.databricks.com) — take **BRAND and COLOR** from here. DM Sans typography, navy-900 (`#1B3139`) text, warm-oat (`#F9F7F4`) page background, white cards, Databricks brand red (`#FF3621`) for primary actions only.
- **Reference site 2 — URL + what to take from it:** A clean **warehouse / inventory dashboard** (e.g. Cin7 https://www.cin7.com, Fishbowl https://www.fishbowlinventory.com, Linnworks https://www.linnworks.com — the card-and-table view) — take **LAYOUT + INFORMATION DENSITY** from here. A calm, scannable table of stock-by-location on the home page, generous whitespace, numeric columns right-aligned with tabular figures, and a single narrow column for the detail page and the form.
- **Reference site 3 — URL + what to take from it:** No specific requirement (the two lenses above are sufficient).
- **Brand constraints (colors, logo, typography, app icon):**
  - **Color:** navy `#1B3139` text, warm-oat `#F9F7F4` page surface, white cards, brand red `#FF3621` for the primary action / accent only (Receive, Pick, Save, the active link). Keep the stock table itself calm and high-contrast so quantities and SKUs are easy to scan.
  - **Semantic:** `#2E844A` success, `#FFAB00` warning, `#0176D3` info, brand red for error. Meaning is always carried by text as well, never color alone.
  - **Typography:** DM Sans for UI, DM Mono for code/numerics. No custom web font beyond what the theme loads.
  - **Spacing:** a 4px base grid (`--space-1` .. `--space-12`).
  - **Radius:** soft containers (`--radius-lg` cards), sharp primary CTA (`border-radius: 0`, a Databricks brand signature). Cards are white on the warm-oat background with a soft navy-tinted shadow and a gentle radius; the primary button is solid brand-red with sharp (0px) corners. Keep these consistent across home, detail, and form.
  - App icon: warehouse-themed (use the scaffold default / staged warehouse icon).
  - **Materialized token theme to leverage:**
    ```css
    :root {
      --font-sans: 'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      --text-xs: 10px;
      --text-sm: 13px;
      --text-base: 15px;
      --text-md: 16px;
      --text-lg: 20px;
      --text-xl: 24px;
      --text-xxl: 29px;
      --line-height-body: 1.5;
      --line-height-heading: 1.25;
      --line-height-tight: 1.1;
      --font-weight-regular: 400;
      --font-weight-medium: 500;
      --font-weight-semibold: 600;
      --font-weight-bold: 700;
      --color-brand: #FF3621;
      --color-brand-hover: #EB1600;
      --color-brand-light: rgba(255,54,33,0.08);
      --color-navy-900: #1B3139;
      --color-navy-700: #1B5162;
      --color-navy-500: #618794;
      --color-navy-400: #90A5B1;
      --color-navy-300: #C4CCD6;
      --color-navy-200: #E5EAF1;
      --color-navy-100: #EDF2F8;
      --color-success: #2E844A;
      --color-success-light: rgba(46,132,74,0.10);
      --color-warning: #FFAB00;
      --color-warning-light: rgba(255,171,0,0.12);
      --color-info: #0176D3;
      --color-info-light: rgba(1,118,211,0.10);
      --color-error: #FF3621;
      --color-error-light: rgba(255,54,33,0.08);
      --color-card: #FFFFFF;
      --color-page: #F9F7F4;
      --color-cool: #F0F2F5;
      --color-text: #1B3139;
      --color-text-secondary: #1B5162;
      --color-text-tertiary: #618794;
      --color-text-disabled: #90A5B1;
      --color-text-inverse: #FFFFFF;
      --space-0: 0px;
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 20px;
      --space-6: 24px;
      --space-8: 32px;
      --space-10: 40px;
      --space-12: 48px;
      --content-max-width: 960px;
      --narrow-max-width: 560px;
      --navbar-height: 64px;
      --tap-target: 44px;
      --border-width: 1px;
      --border-accent: 2px;
      --focus-ring: 2px;
      --lift: -2px;
      --icon-sm: 16px;
      --icon-md: 24px;
      --icon-brand: 32px;
      --icon-empty: 48px;
      --radius-none: 0px;
      --radius-sm: 4px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --radius-xl: 15px;
      --radius-pill: 999px;
      --shadow-sm: 0 2px 8px rgba(27,49,57,0.06);
      --shadow-md: 0 4px 16px rgba(27,49,57,0.08);
      --shadow-lg: 0 2px 4px rgba(27,49,57,0.04), 0 8px 24px rgba(27,49,57,0.10), 0 16px 48px rgba(27,49,57,0.08);
      --shadow-navbar: 0 2px 12px rgba(27,49,57,0.24);
      --mobile: 480px;
      --tablet: 768px;
      --desktop: 1024px;
      --transition-fast: 0.15s ease;
      --transition-base: 0.2s ease;
      --toast-dismiss: 3s;
    }
    ```
- **Interaction / accessibility constraints:**
  - Every state is shown explicitly: an empty stock location shows an explicit empty state ("No stock at this location — receive an inbound shipment"), never a blank page; a SKU with no batches or serial detail shows a clear "not tracked", never a blank region.
  - Forms never fail silently: a successful save lands on a confirmation view (or an inline green flash for an adjustment); a validation problem (a pick that would overcommit, an unknown SKU) is shown inline next to the field that caused it, naming the field.
  - Barcode scans are the primary input on the warehouse floor. A scan succeeds with a green flash and the stock row updating in place; a scan that fails (unknown barcode, locked SKU) flashes the scan zone red and shows a persistent toast.
  - The home grid and the detail page are read-mostly; the no-silent-failure principle applies to the receipt, pick, adjustment, and cycle-count forms.
  - Touch targets sized for warehouse-floor tablet use (`--tap-target: 44px`).
- **Feedback matrix (no silent failures, no unacknowledged success):** specify the success and failure behavior per action, so the UI never leaves a result unacknowledged:

  | Action | Success | Failure |
  |---|---|---|
  | Form submit | navigate to a confirmation view (navigation IS the feedback) | inline alert + a field-named error |
  | Barcode scan | row updates in place + green scan-zone flash | red scan-zone flash + persistent error toast |
  | Inline mutation (adjust, status change) | auto-dismiss success toast (~3s) | persistent error toast |
  | Delete / remove | success toast + optimistic update | persistent toast + local revert |
  | Page load | n/a | inline alert replaces the content area |
  | Button action | disabled + spinner while in flight | re-enabled + error shown |

  Every error is routed through a single `describeError()` helper that maps status codes to actionable text and includes the status code. Optimistic updates revert on failure. Feedback never shifts the page layout: toasts are fixed-position; inline alerts are reserved for page-load and validation.
- **Component vocabulary (emit the full set, named in `design-guide.json` `components`):** the UI is built from a small, consistent set of named components so every screen looks like the same product. Every feature page composes these rather than hand-rolling markup:
  - **Navbar** — navy top bar (64px) with a 2px brand-red bottom border; the app icon + "StockFlow" title on the left, nav links on the right, active link in brand red.
  - **Page** — warm-oat background, a centered ~960px content column, a `page__header` with the page title (app icon next to the name); a narrow (560px) variant for the detail page and forms.
  - **Card** — white surface, soft navy-tinted shadow, gentle radius, with a subtle hover lift (shadow deepens, lifts a couple px); the stock table and detail panels live in cards.
  - **Buttons** — primary (solid brand-red, sharp corners), secondary (outlined navy-200), ghost (text-only), plus danger, danger-outline, and a small (`--sm`) size. Corners stay sharp on the primary everywhere; minimum 44px tap target.
  - **Form inputs** — persistent visible labels (never placeholder-only), an info-color focus ring, and an explicit error state (error border + error-light fill); a validation problem shows inline next to the field, naming it.
  - **Stock table** — cool uppercase header row; quantity cells right-aligned in the mono/tabular figure font; an in-place row flash on update.
  - **Status (stock-state) pills** — in-stock / low / out / on-order / quarantined / not-tracked, each a pill whose meaning is carried by BOTH text and color (never color alone).
  - **Empty state** — an icon + a teaching heading + copy + a CTA (e.g. "No stock at this location — receive an inbound shipment").
  - **Toasts** — fixed top-right; a success toast auto-dismisses, an error toast persists; feedback never shifts the page layout.
- **Iconography + identity:**
  - **App icon (required, not optional):** StockFlow has a brand icon — a warehouse mark — shown next to the title, plus a favicon for the browser tab. The asset ships **with this brief**, staged at `.consort/design/assets/warehouse.png`. Wiring the warehouse icon in is a brand requirement: a shell that ships without the icon actually rendering (navbar image + favicon), or with a placeholder, has NOT met it. The UX Designer declares where the asset installs in `design-guide.json` `app_icon` (`source` = `.consort/design/assets/warehouse.png`, `install_to` = `client/public/warehouse.png`), and the design-apply step installs it and wires the favicon (`index.html <link rel="icon">`) + the navbar brand image. The design system owns the install path. Do NOT fall back to the scaffold `favicon.svg`.
  - **Icon set:** use a single line-style icon set consistently (e.g. inbound / outbound, scan, warehouse, search, and the stock-level states); do not mix icon styles.
  - **Name + tagline:** the product is "StockFlow" — warehouse operations, batched and barcoded, on one Postgres. Empty states and headings use this plain, guiding voice.
