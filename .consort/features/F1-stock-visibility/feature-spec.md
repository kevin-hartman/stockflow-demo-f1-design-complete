# F1 Stock visibility

## Summary
An operator files, finds, views, and adjusts stock for a SKU at a location in the single warehouse. Each (sku, location) pair is exactly one record, and adjustments update the row in place with an audit trail that can't be changed.

## Stories
- S1-file-stock-record: file a stock record for a SKU at a location with a tracking code; re-filing an existing pair updates it in place.
- S2-find-by-tracking-code: find a record by scanning or typing its tracking code (<200ms).
- S3-view-stock-list-and-sku-detail: home stock list and SKU detail across locations.
- S4-adjust-quantity-in-place: adjust quantity, row updates in place, with an audit trail that can't be changed.

## Data semantics
- One record per (sku, location); a write for an existing pair updates that record in place (S1 AC2).
- Par level, batch, and serial are optional; when omitted they are stored absent and read as "not tracked" (S1 AC3).
- Quantity is never below zero (S1 AC5, S4).
- A quantity-0 record counts as a record: it still appears in the home list and SKU detail, displayed with quantity 0 (PO decision 2026-10-28, Kevin Hartman). The record stays visible; both view stories follow this.

## Out of scope
Inbound receipts (F2), outbound picks (F3), multi-warehouse, splitting the tracking code, cycle counting, authentication (actor is operator-entered).

## Open questions
- S1: Does a quantity-0 record count as holding stock in list/detail views? Recommended: keep it on record but flag it for PO decision before S3 is drafted.
- S1: On re-filing an existing (sku, location), should the quantity replace the existing one (recommended, per "update in place") or add to it?
- S1: May one tracking code be filed for two different (sku, location) pairs? Recommended: no (it identifies location), reject with a field-named message; PO to confirm.
- S2: Should a lookup hit show the row in place on the lookup screen (recommended) or go straight to the SKU detail view (S3)?
- S2: Is the 200ms target measured end to end on the floor tablet over the warehouse network (recommended), or server-side only?
- S3: RESOLVED (PO, 2026-10-28) — quantity-0 records appear in both the list and detail views, displayed with quantity 0. S3 AC1/AC2 already render every filed (sku, location) record regardless of quantity, so they satisfy this decision as written.
- S3: Does the home list need sorting or search beyond lookup by tracking code (S2)? Recommended: no for F1, listed by SKU then location.
- S4: Does the operator enter an adjustment as a new absolute quantity (as AC1 is drafted) or as a +/- change? Recommended: absolute for F1.
- S4: Should re-filing an existing pair in S1 (AC2) also write an adjustment history entry? Recommended: yes, so every quantity change is traceable. PO to confirm.
