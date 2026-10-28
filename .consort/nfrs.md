---
author: Product Owner
---

# NFRs (StockFlow)

The Product Owner's non-functional requirements for StockFlow, the
Architect's intake. Each `## Required` item is a hard block: the
architecture must cover every `R<n>`. Categories walked: architecture
layering, performance, scalability, security, observability,
operability, resilience.

## Required

- R1 (data durability / audit): existing stock data survives every
  schema migration with no loss. Each iteration's additive model change
  preserves the inventory records created before it, and every
  inventory adjustment keeps an unmodifiable timestamp and actor.
- R2 (integrity / resilience): stock levels never go below zero and
  never overcommit beyond available quantity. A pick that would
  overcommit is rejected at write time; never a stored negative, never a
  silently-allowed double-allocation.
- R3 (integrity / resilience): every SKU at every location is uniquely
  addressable by `(sku, location)`; no two records share that pair. A
  collision is resolved at write time; never two stored duplicates,
  never an error page.
- R4 (testing / operability): integration tests run against the paired
  Lakebase branch, not a mock or in-memory substitute. CI refuses to
  merge a PR whose integration tests did not run against a real branch.
- R5 (architecture layering): the UI is a single-page web application.
  The tablet loads the app once and navigates client-side (home, SKU
  detail, receipt / pick / adjustment forms) with no full-page reloads;
  a stock adjustment updates the affected row in place (optimistic
  update, reconciled against the server response). The client is a
  React + TypeScript app under `client/`; the backend is a JSON API
  whose boundary returns data, not server-rendered HTML. The client
  ships its own component tests; the API is covered by the R4 branch
  integration tests.
- R6 (performance): barcode-scan interactions feel immediate; perceived
  response under ~200ms from scan event to UI update.
- R7 (observability): validation messages are clear and specific,
  naming the offending field (never just "bad request"); each inventory
  adjustment's timestamp + actor is recorded and queryable (per R1).
- R8 (operability): migrations are additive where possible so reads
  keep working during rollout; a new column or table never breaks an
  existing page.
- R9 (resilience): a stock-level row missing optional detail (par
  level, batch, serial) still renders cleanly, defaulting to empty and
  showing an explicit "not tracked"; never a null crash or blank region.

## Preferences

- Scalability: no specific target for the first version; keep the model
  simple enough that multi-warehouse and a split tracking code
  (location / batch / serial) can be added later as additive changes.
- Security: no authentication or authorization in the first version;
  the audit trail (R1) is the only security-adjacent requirement.
- Environment: the app connects to the substrate-provisioned
  `databricks_postgres` database via the `DATABASE_URL` the post-checkout
  hook writes from the paired Lakebase branch. Leave the scaffold's
  connection defaults alone; the schema lives in `databricks_postgres`
  (migrations create tables, not databases).

## Out of bounds

- No authentication, authorization, or per-tenant ownership in the
  first version.
- No caching layer and no multi-region concerns.
- No real-time multi-operator conflict resolution beyond the simple
  no-overcommit rule (R2).
- Do NOT rename the database or set `DB_NAME` / `PGDATABASE` to an
  app-specific name, and do not make the database name a requirement;
  the branch provisions only `databricks_postgres`.
