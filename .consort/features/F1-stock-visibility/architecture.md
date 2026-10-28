# Architecture – F1 Stock visibility

## Layering summary

Service-backed feature (persists `stock_records`). Project-wide canonical layout (first feature):

| Role | Module | May import |
|---|---|---|
| boundary | `app/routes/` (FastAPI routers, JSON only; UI is the React SPA in `client/`, `renders_via: react`) | service |
| service | `app/services/` (validation, normalization, upsert orchestration; re-exports `get_session`) | repository, models |
| repository | `app/repositories/` (only layer touching the session; `session.py` is the request-scoped session door) | models, infrastructure |
| models | `app/models/` package, one module per entity (`app/models/stock_record.py`) | infrastructure (`Base`) |
| infrastructure | `app/database.py` (engine, `SessionLocal`, `Base`) | – |

S1 endpoint: `EP1-file-stock-record` `POST /api/stock-records` (create-or-update by `(sku, location)`). Client: `client/src/api/stockRecords.ts` → `hooks/useFileStock.ts` → `pages/FileStockPage.tsx` at `/stock/new`.

| AC | Layer | Owner module |
|---|---|---|
| AC1-file-stock-form | E2E | FileStockPage → `app/routes/stock_records.py` → `app/services/stock_records.py` |
| AC2-refile-same-pair-updates-in-place | API | `app/services/stock_records.py` + `app/repositories/stock_records.py` (upsert) |
| AC3-optional-fields-omitted-accepted | API | `app/services/stock_records.py` (blank → NULL) |
| AC4-missing-required-field-named | E2E | FileStockPage field errors ← service 422 envelope |
| AC5-negative-quantity-rejected | API | `app/services/stock_records.py` + DB CHECK |

## Architectural Concerns Mapping

| Concern | Owner layer | Module | Notes |
|---|---|---|---|
| Input validation (required, quantity ≥ 0) | boundary + service | `app/routes/` schema, `app/services/stock_records.py` | 422 `{errors:[{field,message}]}` naming the field (R7) |
| Uniqueness / collision resolution | repository + DB | `app/repositories/stock_records.py`, UNIQUE(sku,location) | `INSERT … ON CONFLICT DO UPDATE` (R3) |
| Non-negative stock | service + DB | CHECK quantity ≥ 0 | defense in depth (R2) |
| Transactions | service | `app/services/stock_records.py` | one transaction per filing |
| Audit (timestamp/actor) | service + repository + DB | `app/services/stock_adjustments.py`, `app/repositories/stock_adjustments.py`, `app/models/stock_adjustment.py` | S4: append-only `stock_adjustments`, operator-typed actor (no auth V1), server `created_at`, UPDATE trigger + 405 on mutation (R1, OD1 resolved) |
| Adjustment atomicity | service | `app/services/stock_adjustments.py` | row lock + quantity update + audit insert in one transaction (PI18) |
| Optimistic row update | client hooks | `client/src/hooks` adjust mutation | optimistic set, reconcile to server `record.quantity`, revert on 422/error (R5) |
| Auth/authz | – | N/A | out of bounds V1 |
| Logging/observability | cross-cutting | app logging | field-named validation messages |
| Config | infrastructure | env `DATABASE_URL` | twelve-factor; scaffold defaults untouched |
| Caching | – | N/A | out of bounds |

## Pattern proposals

- Repository per aggregate (`StockRecordRepository.upsert`) – SRP; service depends on it, not the ORM.
- Service returns a domain result `(record, outcome)`; route maps outcome to 201/200 – boundary owns HTTP only.
- Pydantic request/response schemas at the boundary; normalization of blank optional strings to `None` in the service.
- Client: typed `api/` fetch + `hooks/` mutation + `pages/` form; field errors rendered from the server envelope.
- S2: `StockRecordRepository.find_latest_by_tracking_code` + service `lookup_by_tracking_code` returning record-or-None; route `GET /api/stock-records/lookup?code=` maps None to 404 (EP2). Client `useTrackingLookup` hook drives the scan-zone `lookup-result` / `lookup-not-found` states; null optional fields render "not tracked" (NFR10).
- S4: `StockAdjustmentRepository` (insert + list_by_record, no update/delete) + service `adjust_quantity(record_id, quantity, actor)` validating quantity ≥ 0 and non-blank actor, locking the record, writing both rows; routes EP5 POST / EP6 GET / EP7 405. Client `useAdjustQuantity` (optimistic) + `useAdjustmentHistory` drive the inline `adjust-row-<sku>-<location>` and `adjustment-history` panel.

## Risks

- Scaffold ships a flat `app/models.py`; it must be converted to the `app/models/` package (keep `Base` re-export) or module placement fails.
- Upsert via `ON CONFLICT` is Postgres-specific – acceptable (Lakebase only, no in-memory tests).
- OD3 resolved non-unique: a shared tracking code returns only the most recently updated row; revisit if operators need all matches (would change EP2 shape to list).
- AP1 needs a non-unique index on `stock_records.tracking_code` (additive migration, R8) to hold the 200ms budget.
- S4 PI17 trigger blocks UPDATE only; DELETE is refused at the API (EP7) and left open at the DB so FK-aware test cleanup can delete adjustments before stock_records (PI11 RESTRICT).
- OD5 (deferred): an S1 re-file changing quantity does not write an audit entry; revisit if every quantity change must be audited.
- Concurrent adjustments serialize on `SELECT … FOR UPDATE`; no multi-operator conflict resolution beyond that (out of bounds).
- S3 EP3 returns the whole table unpaginated; fine for a single warehouse in V1, revisit with pagination if row counts grow.
- AP2 (by sku) is expected to ride the leading column of the PI1 (sku, location) unique index; DBA to confirm or add an index.

## Decisions

- OD4 (resolved): 201 `filed` / 200 `updated`. Recommend accept.
- OD1 (resolved by S4): separate append-only `stock_adjustments` table, actor typed by the operator, written atomically with the quantity update; S1 filing unaffected. Recommend accept.
- OD5 (deferred): whether re-file is audited. Recommend defer.
- OD2 (deferred): overcommit belongs to the Pick feature; N/A in F1.
- OD3 (resolved by S2): tracking_code NOT unique (a unique constraint would contradict S1 filing); lookup returns the most recently updated match (EP2). Recommend accept.

## Test strategy

Real integration tests against the paired Lakebase branch (pytest-bdd, Alembic migrations applied first, FK-aware targeted DELETE cleanup); no mocks/stubs/in-memory DB. API suite: AC2, AC3, AC5, plus PI1–PI10 constraint tests and NFR fitness tests. Playwright e2e against the live API: S1 AC1, AC4; S2 AC1–AC4 (EP2 lookup); S3 AC1–AC4 (EP3 list, EP4 SKU detail, NFR11 not-tracked render, stock-empty). NFR6 latency fitness test on EP2 against the branch; AP1 index realized by the DBA. S4: API suite AC2, AC5 (EP5/EP7, PI11–PI19, direct-UPDATE refusal); Playwright AC1, AC3, AC4 (optimistic update, field-error-actor, adjustment-history via EP6); AP3 index by the DBA.

## Sign-off

Recommendation: **proceed**. – Architect Reviewer
