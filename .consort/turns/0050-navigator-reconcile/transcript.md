# navigator-reconcile (navigator) – sonnet

## Prompt

```
FEATURE-COMPLETE RECONCILIATION for F1-stock-visibility: every story is now designed + gated. Independently check the WHOLE set of stories against ITSELF — symmetrically, every story vs every other, INCLUDING the first-designed story (which was never checked against its later siblings). The cross-story context (all stories' ACs + the architecture's open_decisions + its mandated not-null fields) is injected below. Look ONLY for CROSS-STORY defects: an AC that contradicts another story's gated AC; a mandated (not-null) field no story's submit AC supplies; two stories' ACs overlapping on the same observable behavior; a persistence invariant anchored to the wrong story. Do NOT re-review a single story in isolation — each already passed its own reflect + gate. Write the verdict to <PROJECT_ROOT>/.consort/features/F1-stock-visibility/reconcile-verdict.json: {"version":1,"passed":<bool>,"findings":[{"owner":"spec-author"|"test-strategist"|"architect-reviewer"|"ux-designer","story":"<the OWNING story to change>","detail":"<the cross-story defect>","ac_ids":["<exact AC id(s)>"],"severity":"blocking"|"advisory"}]}. Use passed:true with findings:[] when the stories are mutually consistent. Each finding names the OWNING story (the one reopened + changed) and its author. Produce ONLY the verdict file, then stop.FEATURE-COMPLETE CROSS-STORY RECONCILIATION — every story below is now designed + gated. Check the WHOLE set against ITSELF, symmetrically (every story vs every other, including the first-designed one): an AC that contradicts another story's gated AC; a mandated (not-null) field no story's submit AC supplies; two stories' ACs that overlap on the same observable behavior; an invariant anchored to the wrong story. For each defect, name the OWNING story (the one to change) + its author (owner). This IS the context — do not run `consort-cross-story-context` yourself.

{
  "stories": [
    {
      "story": "S1-file-stock-record",
      "acs": [
        {
          "ac_id": "AC1-file-stock-form",
          "status": "draft",
          "layer": "E2E",
          "given": "the operator is on the file-stock screen in the single warehouse",
          "when": "they submit a SKU, location, tracking code, and quantity",
          "then": "a confirmation is shown on screen and a stock record for that (sku, location) exists with the submitted tracking code and quantity",
          "architectural_notes": "Client↔server round-trip: FileStockPage (/stock/new) posts via client/src/api + hooks to the app/routes boundary, which delegates to app/services/stock_records.py and the repository upsert; the confirmation renders the server's outcome. Verified by Playwright against the live API on the paired branch, then the stock_records row is asserted."
        },
        {
          "ac_id": "AC2-refile-same-pair-updates-in-place",
          "status": "draft",
          "layer": "API",
          "given": "a stock record already exists for a (sku, location) pair",
          "when": "the operator files a record for the same (sku, location) again with a new quantity or tracking code",
          "then": "the existing record is updated in place with the new values, exactly one record for that pair exists, no duplicate is created, and no error page is shown",
          "architectural_notes": "Write rule: collision on (sku, location) is resolved at write time by the repository's INSERT ... ON CONFLICT DO UPDATE inside the service transaction (PI1, PI9, R3). Owner: app/services/stock_records.py + app/repositories/stock_records.py; the route maps outcome 'updated' to 200, never an error."
        },
        {
          "ac_id": "AC3-optional-fields-omitted-accepted",
          "status": "draft",
          "layer": "API",
          "given": "the operator is filing a stock record",
          "when": "they submit it with par level, batch, and serial left blank",
          "then": "the record is accepted and stored with those fields absent (not tracked), not rejected and not stored as empty strings or zero",
          "architectural_notes": "The service normalizes blank par_level/batch/serial to None before persisting, so the columns are NULL (nullable, PI7/PI8 forbid '' and negatives) for readers to show 'not tracked' (R9). Owner: app/services/stock_records.py; verified by branch-DB API test."
        },
        {
          "ac_id": "AC4-missing-required-field-named",
          "status": "draft",
          "layer": "E2E",
          "given": "the operator is filing a stock record",
          "when": "they submit with a required field (SKU, location, tracking code, or quantity) missing",
          "then": "a clear message naming the missing field is shown and no record is created or changed",
          "architectural_notes": "Server-decided rejection rendered inline: the boundary/service validation returns the 422 field-named errors envelope and the client maps each error to field-error-<name>; no row is written (R7). Verified by Playwright against the live API plus a table-unchanged check."
        },
        {
          "ac_id": "AC5-negative-quantity-rejected",
          "status": "draft",
          "layer": "API",
          "given": "the operator is filing a stock record",
          "when": "they submit a quantity below zero",
          "then": "a clear message naming the quantity field is shown and no record is created or changed, so stock never goes below zero",
          "architectural_notes": "Domain rule quantity >= 0 enforced in app/services/stock_records.py (422 naming 'quantity') with the DB CHECK PI6 as defense in depth, so a negative never persists (R2). Verified by branch-DB API test that stock_records is unchanged."
        }
      ]
    },
    {
      "story": "S2-find-by-tracking-code",
      "acs": [
        {
          "ac_id": "AC1-lookup-shows-matching-record",
          "status": "draft",
          "layer": "E2E",
          "given": "a stock record exists with tracking code T",
          "when": "the operator scans or types T into the lookup field and submits",
          "then": "the matching record's row is shown with its SKU, location, tracking code, and quantity",
          "architectural_notes": "Client↔server round-trip: the Stock home scan zone (client/src/pages + hooks/api) calls the app/routes lookup boundary, which delegates to app/services/stock_records.py and the repository's tracking_code query (AP1); the lookup-result card renders the server's record. Verified by Playwright against the live API on the paired branch with a seeded stock_records row."
        },
        {
          "ac_id": "AC2-scan-to-screen-under-200ms",
          "status": "draft",
          "layer": "E2E",
          "given": "a stock record exists with tracking code T on the floor tablet",
          "when": "the operator scans T",
          "then": "the matching row appears on screen within about 200ms of the scan",
          "architectural_notes": "Performance contract R6/NFR6: scan (Enter in lookup-input) to lookup-result visible within ~200ms, served by the indexed tracking_code lookup (AP1) with no full page reload. Measured by a Playwright timing assertion against the live API on the paired branch; owner app/services/stock_records.py + app/repositories/stock_records.py."
        },
        {
          "ac_id": "AC3-unknown-code-shows-not-found",
          "status": "draft",
          "layer": "E2E",
          "given": "no stock record has tracking code U",
          "when": "the operator scans or types U and submits",
          "then": "a clear 'no record found for U' message is shown, with no error page or crash",
          "architectural_notes": "Server-decided not-found outcome: the service returns none, the route maps it to the EP2 404 body, and the client renders the lookup-not-found empty state naming U, never an error page. Verified by Playwright against the live API on the paired branch with no matching row."
        },
        {
          "ac_id": "AC4-found-record-shows-not-tracked",
          "status": "draft",
          "layer": "E2E",
          "given": "a stock record with tracking code T was filed with par level, batch, and serial absent",
          "when": "the operator looks up T",
          "then": "the lookup result shows 'not tracked' for par level, batch, and serial, never a blank area or a crash",
          "architectural_notes": "R9/NFR10: NULL par_level/batch/serial (stored absent by S1 AC3) arrive as null in the EP2 record and the lookup-result presentation renders 'not tracked' for each, never blank. Verified by Playwright against the live API on the paired branch with a seeded row whose optional columns are NULL."
        }
      ]
    },
    {
      "story": "S3-view-stock-list-and-sku-detail",
      "acs": [
        {
          "ac_id": "AC1-home-list-shows-every-record",
          "status": "draft",
          "layer": "E2E",
          "given": "stock records exist, including one SKU held at two or more locations",
          "when": "the operator opens the home stock list",
          "then": "one row is shown per (sku, location) record with its SKU, location, tracking code, and quantity, so the same SKU appears once for each location",
          "architectural_notes": "Client↔server read: the Stock home page (client/src/pages + hooks/api) fetches EP3 from the app/routes boundary, which delegates to app/services/stock_records.py and the repository list query; one stock-table row per (sku, location) row returned. Verified by Playwright against the live API on the paired branch with a SKU seeded at two locations."
        },
        {
          "ac_id": "AC2-sku-detail-shows-all-its-locations",
          "status": "draft",
          "layer": "E2E",
          "given": "SKU X is held at several locations and other SKUs also exist",
          "when": "the operator opens the detail view for SKU X from the list",
          "then": "the detail view shows every location record for X with its quantity and tracking code, and no records for other SKUs",
          "architectural_notes": "Client↔server read: the stock-link navigates to /skus/:sku, whose page fetches EP4; the service filters by sku via the repository (AP2, served by the PI1 index prefix) so only that SKU's rows render in sku-locations. Verified by Playwright against the live API on the paired branch with other SKUs seeded as distractors."
        },
        {
          "ac_id": "AC3-list-and-detail-show-not-tracked",
          "status": "draft",
          "layer": "E2E",
          "given": "a stock record has par level, batch, and serial absent",
          "when": "the operator views it on the home list and on its SKU detail view",
          "then": "both views show 'not tracked' for each absent field, never a blank area or a crash (R9)",
          "architectural_notes": "R9/NFR11 reader side: NULL par_level/batch/serial (stored absent per S1 AC3/NFR9) arrive as null in EP3 and EP4 rows, and the list cells and detail cells both render 'not tracked', never blank. Verified by Playwright against the live API on the paired branch with a seeded row whose optional columns are NULL."
        },
        {
          "ac_id": "AC4-empty-list-shows-empty-state",
          "status": "draft",
          "layer": "E2E",
          "given": "no stock records exist",
          "when": "the operator opens the home stock list",
          "then": "a clear empty-state message is shown instead of a blank table or an error",
          "architectural_notes": "Server-decided empty outcome: EP3 returns [] when stock_records has no rows, and the Stock home renders the stock-empty empty state with the File stock CTA instead of a blank table or error. Verified by Playwright against the live API on the paired branch after cleanup leaves the table empty."
        }
      ]
    },
    {
      "story": "S4-adjust-quantity-in-place",
      "acs": [
        {
          "ac_id": "AC1-adjust-updates-row-in-place",
          "status": "draft",
          "layer": "E2E",
          "given": "a stock record is shown as a row on screen",
          "when": "the operator enters a new quantity and their actor name for that row and submits",
          "then": "the row shows the new quantity at once with no page reload, then shows the quantity the server returns, and that value is what is stored (R5)",
          "architectural_notes": "Client↔server round-trip (R5): the inline adjust form (client/src/components + hooks/api) optimistically sets the row's quantity, POSTs EP5 to the app/routes boundary, and reconciles the row to the server-returned record.quantity. app/services/stock_adjustments.py owns the transaction (PI18): repository locks the stock_records row, updates quantity and inserts the stock_adjustments entry. Verified by Playwright against the live API on the paired branch, then the stored quantity is asserted."
        },
        {
          "ac_id": "AC2-adjust-below-zero-rejected",
          "status": "draft",
          "layer": "API",
          "given": "a stock record with quantity Q is shown as a row",
          "when": "the operator submits an adjustment that would leave the quantity below zero",
          "then": "a clear message naming the quantity field is shown, the stored quantity stays Q, and the row goes back to showing Q (R2)",
          "architectural_notes": "Write rule (R2): app/services/stock_adjustments.py rejects a new quantity < 0 with a 422 naming 'quantity' before any write, with stock_records CHECK PI6 as defense in depth; the transaction (PI18) leaves stock_records and stock_adjustments unchanged. Verified by a branch-DB API test; the client revert-to-Q is the NFR14 rejection clause."
        },
        {
          "ac_id": "AC3-missing-actor-named",
          "status": "draft",
          "layer": "E2E",
          "given": "a stock record is shown as a row",
          "when": "the operator submits an adjustment with the actor field left blank",
          "then": "a clear message naming the actor field is shown and the quantity is not changed",
          "architectural_notes": "Server-decided rejection rendered inline: the actor is an operator-typed form field (no auth in V1); the service rejects a blank/whitespace actor with a 422 naming 'actor' (PI15 as DB backstop) and the client maps it to field-error-actor and keeps the stored quantity. Owner app/services/stock_adjustments.py; verified by Playwright against the live API plus a no-change check on both tables."
        },
        {
          "ac_id": "AC4-adjustment-history-lookup",
          "status": "draft",
          "layer": "E2E",
          "given": "a stock record has had one or more accepted adjustments",
          "when": "the operator opens that record's adjustment history",
          "then": "each adjustment is listed with its timestamp, the actor entered, and the quantity before and after, in time order (R1, R7)",
          "architectural_notes": "Client↔server read (R1, R7): the history toggle fetches EP6 from app/routes, which delegates to app/services/stock_adjustments.py and the repository query by stock_record_id ordered by created_at, id (AP3); the adjustment-history panel renders each entry's server timestamp, actor and quantity before/after. Verified by Playwright against the live API on the paired branch after seeded adjustments."
        },
        {
          "ac_id": "AC5-audit-entries-immutable",
          "status": "draft",
          "layer": "API",
          "given": "an adjustment history entry exists for a stock record",
          "when": "any attempt is made to edit or delete that entry",
          "then": "the attempt is refused, and the entry's timestamp, actor, and quantities stay exactly as recorded",
          "architectural_notes": "Immutability (R1): no route mutates an audit entry; DELETE/PUT/PATCH on an adjustment return 405 (EP7), the repository is insert-only for stock_adjustments, and a BEFORE UPDATE trigger (PI17) refuses a direct DB UPDATE. Verified by a branch-DB API test plus a direct-UPDATE attempt, then re-reading the entry unchanged."
        }
      ]
    }
  ],
  "open_decisions": [
    {
      "id": "OD1-adjustment-audit-trail",
      "question": "Where is the immutable timestamp + caller-supplied actor (no auth in V1) for each inventory adjustment stored (separate stock_movements table vs columns on stock_records)? S1 filing records only created_at/updated_at.",
      "decision_status": "resolved",
      "resolved_by_story": "S4-adjust-quantity-in-place",
      "resolution": "A separate append-only stock_adjustments table (FK stock_record_id, actor typed by the operator — no auth in V1 — server created_at, quantity_before/after), written atomically with the stock_records quantity update (PI18). S1 filing/re-file does NOT write an adjustment entry, so gated S1 ACs are unaffected; stock_records stays the one row per (sku, location)."
    },
    {
      "id": "OD2-overcommit-rule",
      "question": "The R2 no-overcommit rule needs a pick/allocation operation, which F1 does not introduce; which feature/story owns it?",
      "decision_status": "deferred"
    },
    {
      "id": "OD3-tracking-code-uniqueness",
      "question": "Is tracking_code unique across stock_records (one record per code) or may several (sku, location) rows share a code for find-by-tracking-code?",
      "decision_status": "resolved",
      "resolved_by_story": "S2-find-by-tracking-code",
      "resolution": "tracking_code is NOT unique (no DB unique constraint; S1 filing never rejects a shared code, so adding one would contradict gated S1 AC1/AC2). Lookup returns the single most recently updated matching row (EP2), indexed by AP1."
    },
    {
      "id": "OD4-file-outcome-status",
      "question": "How does the API distinguish a new filing from a re-file?",
      "decision_status": "resolved",
      "resolved_by_story": "S1-file-stock-record",
      "resolution": "201 + outcome 'filed' for a new pair, 200 + outcome 'updated' for an in-place re-file (EP1-file-stock-record)."
    },
    {
      "id": "OD5-refile-audit",
      "question": "Should an S1 re-file that changes quantity (EP1 'updated') also append a stock_adjustments entry, or does the audit trail cover only explicit adjustments?",
      "decision_status": "deferred"
    }
  ],
  "required_persistence_fields": [
    {
      "invariant_id": "PI2-sku-not-null",
      "table": "stock_records",
      "brief": "sku is NOT NULL: inserting a row with a null sku is rejected by the DB."
    },
    {
      "invariant_id": "PI3-location-not-null",
      "table": "stock_records",
      "brief": "location is NOT NULL: inserting a row with a null location is rejected by the DB."
    },
    {
      "invariant_id": "PI4-tracking-code-not-null",
      "table": "stock_records",
      "brief": "tracking_code is NOT NULL: inserting a row with a null tracking_code is rejected by the DB."
    },
    {
      "invariant_id": "PI5-quantity-not-null",
      "table": "stock_records",
      "brief": "quantity is NOT NULL: inserting a row with a null quantity is rejected by the DB."
    },
    {
      "invariant_id": "PI12-adjustment-actor-not-null",
      "table": "stock_adjustments",
      "brief": "actor is NOT NULL: inserting an adjustment with a null actor is rejected by the DB (R1)."
    },
    {
      "invariant_id": "PI13-adjustment-timestamp-not-null",
      "table": "stock_adjustments",
      "brief": "created_at is NOT NULL with a server DEFAULT now(): every adjustment carries a DB-assigned timestamp, never a client-supplied or missing one (R1)."
    },
    {
      "invariant_id": "PI14-adjustment-quantities-not-null",
      "table": "stock_adjustments",
      "brief": "quantity_before and quantity_after are NOT NULL: inserting an adjustment missing either is rejected by the DB."
    }
  ]
} Be terse: produce ONLY the required artifact file(s) on disk, then stop with at most a one-line confirmation. Do NOT print a plan, a summary of what you did, rationale, tables, or restate the artifacts to stdout, that output is wasted latency. The files on disk are the deliverable, not your prose.
```

## Tools used

- Write {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/reconcile-verdict.json","content":"{\"version\":1,\"passed\":true,\"findings\":[{\"owner\":\"spec-author\",\"story\":\"S1-file-stock-record\",\"detail\":\"OD5 (deferred): an S1 re-file (AC2) can change quantity in place without a stock_adjustments entry, so the S4 audit trail (R1) can be bypassed by re-filing. Not a contradiction of any gated AC; the human should decide at the gate whether re-file quantity changes must be audited.\",\"ac_ids\":[\"AC2-refile-same-pair-updates-in-place\"],\"severity\":\"advisory\"}]}\n"}

## Final reasoning

Reconcile verdict written: the four stories pass, with one advisory finding. The advisory is that an S1 re-file can change quantity without an audit entry (OD5, still deferred).
