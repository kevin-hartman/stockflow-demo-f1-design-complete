---
author: Spec Author
mode: planning
sprint: 1 (greenfield; no features delivered yet)
ui_track: true
---

# Feature proposals: next sprint

Scope: the **next sprint only**, meaning the overview's "First usable version" at one
warehouse. It must be runnable and demoable as a single-page app (R5). The PO's
sign-off bar is that an operator scans a real barcode and watches the stock row
update in place. Later directions (multi-warehouse, split tracking code, cycle
counting) are deliberately **not** proposed here. Every candidate below is a
user-facing increment, and each one **needs E2E (UI) stories**.

## F1-stock-visibility

- **Ask:** an operator files a stock record for a SKU at a location, finds it again
  by scanning or typing its tracking code, sees it on a home stock list and a SKU
  detail view (the same SKU across several locations in one warehouse), and adjusts
  its quantity. The row updates in place with no page reload.
- **Rationale:** overview "First usable version" bullets 1, 2, 5 and 6. NFRs R1
  (each adjustment keeps an unmodifiable timestamp and actor), R3 (one record per
  `(sku, location)`, so a collision is resolved at write time), R5 (SPA, optimistic
  in-place update), R6 (scan-to-UI in under ~200ms), R7 (validation names the field)
  and R9 (optional par/batch/serial shows "not tracked"). This is the foundation the
  other two candidates write into.
- **E2E (UI) stories needed:** yes. These are file-record form submit, scan/lookup
  of a tracking code, the stock list and SKU detail across locations, and in-place
  quantity adjustment with an inline validation error.
- **Open for PO:** the actor is an operator-entered field (no auth, per Out of
  bounds). Please confirm. Also: does a quantity-0 record still count as "holding
  stock" in the views?
- **Priority:** P1 (must ship first).

## F2-inbound-receipts

- **Ask:** an operator records an inbound receipt (a known supplier delivers a known
  quantity) and puts it away at a chosen location. Stock at that `(sku, location)`
  goes up and the change is visible immediately.
- **Rationale:** overview "First usable version" bullet 3, plus "Receive inbound
  goods… put them somewhere recoverable". NFRs R1 (audited), R3 (a receipt into an
  existing pair increments it and does not duplicate it), R5, R7 and R8 (additive
  migration that keeps F1 records intact).
- **E2E (UI) stories needed:** yes. These are the receipt form submit (supplier,
  SKU/scan, quantity, location) that shows the updated stock row, and the validation
  error for a bad quantity or a missing supplier.
- **Open for PO:** is "known supplier" a managed supplier list, or a free-text
  field for V1?
- **Priority:** P2. It depends on F1.

## F3-outbound-picks

- **Ask:** an operator records a pick for a customer order at a chosen location.
  Stock goes down, and a pick larger than what is there is refused with a clear,
  field-specific message.
- **Rationale:** overview "First usable version" bullet 4, plus "Pick goods… without
  overcommitting". NFRs R2 (never negative and never overcommitted, rejected at write
  time), R1 (audited), R5, R7 and R8.
- **E2E (UI) stories needed:** yes. These are the pick form submit that shows stock
  drawn down in place, and the overcommit attempt that shows the refusal message
  while the row stays unchanged.
- **Open for PO:** is a customer order a reference number only for V1, or an order
  entity with lines? Is the manual tracking-number field (overview Not in scope) part
  of this sprint?
- **Priority:** P3. It depends on F1 and completes the first usable version.
