# F1 DB design
One table `stock_records` (mirrors `app/models/stock_record.py`).
## S1 migration
SC1-create-stock-records: create_table; reversible via drop/recreate (PI10).
## Invariants
- PI1: UNIQUE (sku, location) `uq_stock_records_sku_location` (also the ON CONFLICT target and the lookup index).
- PI2–PI5: NOT NULL on sku, location, tracking_code, quantity.
- PI6/PI7/PI8: the CHECK constraints `ck_stock_records_*`.
- PI9: repository does a single INSERT ... ON CONFLICT (sku, location) DO UPDATE in one transaction.
- PI10: the Alembic downgrade/upgrade round-trip recreates the table and its constraints.
## Access patterns (S1)
None declared at S1. The (sku, location) upsert target is covered by the unique index.

## S2 migration
SC2-add-tracking-code-index: add_index `ix_stock_records_tracking_code_updated_at` (tracking_code, updated_at), non-unique. Reversible (drop index).
## Access patterns (S2)
- AP1-lookup-by-tracking-code: the composite btree serves both the equality match and the ORDER BY updated_at DESC LIMIT 1 with one index scan, so no sort step is needed and the 200ms target (R6) holds. It is non-unique because a tracking code can appear at more than one location.

## S3 migration
No schema changes. S3 only reads existing data.
## Access patterns (S3)
- AP2-records-by-sku: deliberately no new index. `WHERE sku = :sku ORDER BY location` uses the leading column of the UNIQUE (sku, location) btree (PI1), which also returns rows already sorted by location. Another index would be redundant and would add write cost.

## S4 migration (one additive revision)
New table `stock_adjustments` (mirrors `app/models/stock_adjustment.py`). Order: SC3 create_table, SC4 add_index, SC5 no-update trigger. Downgrade drops only the trigger, function, index and table; stock_records is untouched (PI19).
## Invariants (S4)
- PI11: FK stock_record_id -> stock_records(id) ON DELETE RESTRICT, with stock_record_id NOT NULL.
- PI12/PI13/PI14: NOT NULL on actor, created_at (DEFAULT now()), quantity_before and quantity_after.
- PI15: `ck_stock_adjustments_actor_not_blank`.
- PI16: `ck_stock_adjustments_quantities_non_negative`.
- PI17: BEFORE UPDATE trigger `trg_stock_adjustments_no_update` raises on any UPDATE.
- PI18: the repository runs one transaction: SELECT ... FOR UPDATE on the stock_records row, UPDATE quantity, INSERT the adjustment. The CHECK on stock_records (PI6) rolls back a below-zero adjustment.
## Access patterns (S4)
- AP3-adjustments-by-record: composite btree (stock_record_id, created_at, id). It serves the equality filter and the ORDER BY created_at, id without a sort, and it also indexes the FK so RESTRICT checks stay cheap.
