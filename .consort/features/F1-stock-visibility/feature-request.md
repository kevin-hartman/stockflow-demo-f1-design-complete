---
author: Product Owner
feature: F1-stock-visibility
sprint: 1
---

# Let an operator file, find, view, and adjust stock for a SKU at a location, with the row updating in place

## Why

Today the team can't trust what they have or where it is. Before receipts
or picks are useful, an operator has to be able to see and adjust stock at
one warehouse. That is the base of the first usable version (overview
bullets 1, 2, 5, 6), and receipts (F2) and picks (F3) will write into it.

## What I want

- An operator files a stock record for a SKU at a location in our one
  warehouse. Each unit is identified by the single tracking code, which
  covers location, batch, and serial together. We accept that for now.
- The same SKU can be held at several locations in the warehouse. Each
  `(sku, location)` pair is exactly one record. Filing a pair that already
  exists is resolved when it is written: never a duplicate, never an error
  page (R3).
- The operator finds a record again by scanning or typing its tracking
  code. A scan should feel immediate, under about 200ms from scan to
  screen (R6).
- A home stock list and a SKU detail view show that SKU across all its
  locations.
- The operator adjusts a quantity and watches the row change in place,
  with no page reload. The change shows right away and then matches what
  the server returns (R5).
- Stock never goes below zero (R2).
- Every adjustment keeps a timestamp and actor that can't be changed and
  can be looked up (R1, R7). There is no login in this version, so the
  actor is whatever the operator enters.
- A bad input gets a clear message that names the field (R7).
- Missing par level, batch, or serial shows as "not tracked", never a
  blank area or a crash (R9).

## What I see when it's done

A working single-page app on the floor tablet. I scan a real barcode,
find the stock row, adjust its quantity, and watch that row update in real
time without reloading. I can also see the same SKU at several locations
on the list and the detail view.

## Not in this feature

Inbound receipts (F2), outbound picks (F3), multi-warehouse, splitting the
tracking code, cycle counting, and authentication.

## Open for confirmation

Whether a quantity-0 record still counts as holding stock in the list and
detail views is not settled. The spec should flag it for my review and
not assume an answer.
