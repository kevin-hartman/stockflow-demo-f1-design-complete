---
author: Product Owner
---

# StockFlow (product overview)

StockFlow is a warehouse-management application for a mid-market
warehouse operation that has outgrown a shared spreadsheet but finds an
enterprise WMS overpriced and overwrought. This overview is the Product
Owner's standing, open-ended intent; it is refined between iterations as
working software is put into use.

## Who it is for

- **Warehouse-floor operators** who scan goods in, put them on shelves,
  pick them off shelves, count them, and ship them, working from a
  browser on a rugged tablet or a barcode scanner.
- **The inventory manager** who reconciles what the system says against
  what the shelves actually hold.
- **The operations lead** who needs to know whether today's orders are
  going to ship.

## What they need to accomplish

- Know what they have, in what quantity, at which physical location, at
  any point in time.
- Receive inbound goods from a supplier and put them somewhere
  recoverable.
- Pick goods off the shelf for a customer order without overcommitting
  what is actually there.
- Count what is on the shelf and reconcile that count with the system.
- Operate across multiple warehouses without each needing its own copy
  of the system.

## First usable version

The simplest thing that lets the team see and adjust stock at one
warehouse:

- File, retrieve, and adjust the stock level of one SKU at one location.
- Hold stock for the same SKU at multiple locations within one
  warehouse.
- Record inbound receipts: a known supplier delivers a known quantity
  and stock goes up at a chosen location.
- Record outbound picks: a customer order draws stock down at a chosen
  location, and the system refuses to overcommit what is there.
- Each unit is identified by a single tracking code that encodes
  location, batch, and serial together; the team accepts this for now
  and will revisit it later.
- The operator experience is a rich, app-like web experience on the
  warehouse-floor tablet: scan, adjust, and watch the stock row change
  in place, with no page reloads.

Everything beyond this first version is open.

## How it grows

The Product Owner expects to revisit and extend this overview once the
first version is in real use. Likely later directions:

- Full multi-warehouse operation.
- Splitting the single tracking code into separate location, batch, and
  serial fields.
- Cycle counting and reconciliation workflows for the inventory manager.

## Not in scope

- Not a production-grade WMS: no slotting optimization, labor
  management, yard management, or advanced forecasting.
- No carrier-rate shopping, label printing, or shipping integration
  beyond a manual tracking-number field.
- No native mobile app.
- No accounting integration, general-ledger postings, or invoicing.
- No multi-tenant isolation across customer companies; one tenant per
  deployment.

## What I want to see after each sprint

Working software I can actually use, not designs, stubs, or partial
scaffolding. Every iteration lands as something runnable and
demonstrable before the next one starts; that working increment is what
I review to decide the next sprint. Before I sign off, a warehouse
operator must be able to scan a real barcode and see the stock level
update in real time.
