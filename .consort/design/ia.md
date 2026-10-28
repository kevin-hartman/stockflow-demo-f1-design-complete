# StockFlow Information Architecture

## Screens

| Screen | Route | Purpose | Root `data-testid` |
|---|---|---|---|
| Stock (home) | `/` | Stock-by-location table for the warehouse, location filter + search, scan zone; badges per row | `stock-home` (`stock-table`, `stock-row-<sku>-<location>`, `scan-zone`, `empty-state`) |
| SKU detail | `/skus/:sku` | Narrow page: SKU info, quantity per location, tracking code / batch / serial ("not tracked" when absent), recent movements, adjust action | `sku-detail` (`sku-locations`, `adjust-form`) |
| Receive | `/receive` | Inbound receipt form: supplier, SKU (scan or type), quantity, location | `receive-form` |
| Pick | `/pick` | Outbound pick form: order ref, SKU, quantity, location; refuses overcommit inline | `pick-form` |
| Adjust | `/skus/:sku/adjust` (or inline on detail) | Stock adjustment with reason; inline green flash on success | `adjust-form` |
| Confirmation | `/receive/done`, `/pick/done` | Post-submit summary + next actions (another / back to stock) | `confirmation` |
| Cycle count (later) | `/count` | Count a location and reconcile with system quantity | `count-form` |
| About | `/about` | Product voice + version | `about-page` |

Shared seams: `toast-region`, `toast-success`, `toast-error`, `alert-error`, `field-error-<name>`, `loading`.

## Navigation

- Navbar (`navbar`): brand (warehouse icon + "StockFlow") → `/`; links **Stock** `/`, **Receive** `/receive`, **Pick** `/pick`, **Count** `/count` (when built), **About** `/about`; active link in brand red.
- Every screen is a `<Route>` in `client/src/App.tsx`. SKU detail is reached from a stock-table row (SKU link) or a scan; Adjust from the detail page; confirmations only via form submit, each linking back to Stock.
- Client-side routing only; no full-page reloads.

## User flows

1. **See stock** (story: retrieve stock): `/` → table loads (loading → rows or empty-state "No stock at this location — receive an inbound shipment") → filter by location → click SKU → `/skus/:sku`.
2. **Scan to update** (floor primary): `/` scan zone → scan barcode → success: row flashes + updates in place, green scan zone; failure (unknown/locked): red scan zone + persistent error toast.
3. **Receive inbound**: navbar Receive → fill supplier/SKU/qty/location → submit (button disabled + spinner) → `/receive/done` confirmation; invalid → inline field-named error.
4. **Pick outbound**: navbar Pick → SKU/qty/location → submit → confirmation; overcommit → inline `field-error-quantity` naming available qty.
5. **Adjust stock**: SKU detail → adjust (qty + reason) → inline green flash + success toast, row updated; failure → persistent error toast, value reverted.
6. **Multiple locations**: SKU detail lists each location's quantity with status badge.
7. **Cycle count** (later): Count → choose location → enter counts → reconcile variance → confirmation.
