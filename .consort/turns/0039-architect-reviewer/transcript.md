# architect-reviewer (architect-reviewer) – opus

## Prompt

```
Annotate story S4-adjust-quantity-in-place's acceptance criteria + nfrs.md coverage. Author architectural_notes for ALL of story S4-adjust-quantity-in-place's ACs: AC1-adjust-updates-row-in-place, AC2-adjust-below-zero-rejected, AC3-missing-actor-named, AC4-adjustment-history-lookup, AC5-audit-entries-immutable. Every one of this story's ACs MUST end up with a non-empty "architectural_notes" field in its acs/<AC>.json (the layer it lives in + how it realizes the design) — the design gate verifies that, and the spec-author's "layer" field does NOT count. architectural_notes are per-AC, so author the scoped ACs above even when the feature-level architecture.json already exists from an earlier story. For every E2E AC, ALSO pass consort-annotate-ac --ui-seams with the ia.md data-testid seam token(s) the AC's UI drives — the column / cell / region / empty-state / form field it asserts (e.g. "stock-cell-tracking,stock-not-tracked"). A deterministic gate checks each seam is named in <PROJECT_ROOT>/.consort/design/ia.md; if the AC needs a surface the IA does not yet name, declare the seam you need anyway and the gate routes the ux-designer to add it to ia.md. In architecture.json, make an EXPLICIT service_backed call (required): set service_backed:true if the feature persists data (a DB table/migration) or carries business logic, and then you MUST declare boundary, service, and repository layers (plus a "models" PACKAGE app/models/, one module per domain object, NOT a flat app/models.py, when it persists entities); set false ONLY for a trivial static/read-through endpoint. An Infra-layer AC or a migration/schema/storage NFR while service_backed is false hard-blocks the gate. When service_backed:true you MUST also declare architecture.json persistence_invariants[]: the DB-level guarantees the schema enforces (each with id, type one of unique|foreign_key|cascade|not_null|check|transactional|migration_reversible, table, and a one-line brief), covering unique/composite keys, foreign keys + cascade rules, NOT NULL / CHECK constraints, any transactional-atomicity boundary, and migration reversibility. The test-strategist must cover each with a real-branch test; a service_backed feature with no persistence_invariants hard-blocks the gate. When THIS story introduces a NEW read/query shape over the schema — a filter, lookup, sort, or join an AC drives (e.g. "list stock filtered by location", "look up a SKU's rows by sku") that is an INDEX candidate — declare it in architecture.json access_patterns[] (id, a one-line brief, and the table + column(s) it reads) so the DBA is pulled back in to reconsider the physical design for it; this is how a later READ story evolves the schema, since a story that adds no persistence_invariant would otherwise skip the DBA. Declare an access_pattern ONLY for a genuinely new query shape (not for every read, and not for one already covered by a prior story's pattern or a primary-key lookup). REUSE the established project architecture conventions (set by F1-stock-visibility): boundary=app/routes (react), service=app/services, repository=app/repositories, models=app/models, infrastructure=app/database.py. Declare the SAME role -> module paths in architecture.json, do NOT remap or rename an established layer; a divergent layout hard-blocks the spec gate and mismatches the inherited code. Author this story's architectural_notes FRESH from the ACs + IA on disk this turn. On a reflect-revise re-run the self-heal clears this story's prior architectural_notes BY DESIGN, so an absent/empty prior is the expected revise state — re-derive against the corrected ACs + IA. Write every artifact under the ABSOLUTE artifact root <PROJECT_ROOT>/.consort (this feature: <PROJECT_ROOT>/.consort/features/F1-stock-visibility/; this story: <PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S4-adjust-quantity-in-place/); use that absolute path and never resolve or guess the project root yourself.CROSS-STORY CONTEXT — this story is NOT reviewed in isolation. The feature's OTHER stories' ACs, the architecture's open_decisions, and its mandated (not-null) persistence fields are below; use them for the cross-story checks (an AC contradicting a gated sibling AC; a mandated field no sibling submit AC supplies). This IS that context — do not run `consort-cross-story-context` yourself.

{
  "current_story": "S4-adjust-quantity-in-place",
  "sibling_stories": [
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
    }
  ],
  "open_decisions": [
    {
      "id": "OD1-adjustment-audit-trail",
      "question": "Where is the immutable timestamp + caller-supplied actor (no auth in V1) for each inventory adjustment stored (separate stock_movements table vs columns on stock_records)? S1 filing records only created_at/updated_at.",
      "decision_status": "deferred"
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
    }
  ]
} Be terse: produce ONLY the required artifact file(s) on disk, then stop with at most a one-line confirmation. Do NOT print a plan, a summary of what you did, rationale, tables, or restate the artifacts to stdout, that output is wasted latency. The files on disk are the deliverable, not your prose.
```

## Tools used

- Bash {"command":"cd <PROJECT_ROOT>/.consort/features/F1-stock-visibility && cat stories/S4-adjust-quantity-in-place/story.json; for f in stories/S4-adjust-quantity-in-place/acs/*.json; do echo \"== $f\"; cat $f; done; echo; cat architecture.json","description":"Read story S4 ACs and existing architecture.json"}
- Bash {"command":"cd <PROJECT_ROOT>/.consort && cat nfrs.md; ls features/F1-stock-visibility/; grep -n -i -E \"adjust|history|actor|audit\" design/ia.md | head -60; grep -n \"^#\" features/F1-stock-visibility/architecture.md","description":"Read NFR brief, IA adjust/history seams, architecture.md headings"}
- Bash {"command":"cd <PROJECT_ROOT>/.consort/features/F1-stock-visibility && python3 -I - <<'EOF'\nimport json\np='architecture.json'; a=json.load(open(p))\nS='S4-adjust-quantity-in-place'; T='stock_adjustments'\na['persistence_invariants']+= [\n {\"id\":\"PI11-adjustment-record-fk\",\"type\":\"foreign_key\",\"table\":T,\"brief\":\"stock_adjustments.stock_record_id is NOT NULL and REFERENCES stock_records(id) ON DELETE RESTRICT: an adjustment for a nonexistent record is rejected, and a stock record with audit history cannot be silently deleted out from under its trail.\"},\n {\"id\":\"PI12-adjustment-actor-not-null\",\"type\":\"not_null\",\"table\":T,\"brief\":\"actor is NOT NULL: inserting an adjustment with a null actor is rejected by the DB (R1).\"},\n {\"id\":\"PI13-adjustment-timestamp-not-null\",\"type\":\"not_null\",\"table\":T,\"brief\":\"created_at is NOT NULL with a server DEFAULT now(): every adjustment carries a DB-assigned timestamp, never a client-supplied or missing one (R1).\"},\n {\"id\":\"PI14-adjustment-quantities-not-null\",\"type\":\"not_null\",\"table\":T,\"brief\":\"quantity_before and quantity_after are NOT NULL: inserting an adjustment missing either is rejected by the DB.\"},\n {\"id\":\"PI15-adjustment-actor-not-blank\",\"type\":\"check\",\"table\":T,\"brief\":\"CHECK (btrim(actor) <> ''): a blank or whitespace-only actor is rejected at the DB (AC3 defense in depth).\"},\n {\"id\":\"PI16-adjustment-quantities-non-negative\",\"type\":\"check\",\"table\":T,\"brief\":\"CHECK (quantity_before >= 0 AND quantity_after >= 0): an audit entry can never record a negative stock level (R2).\"},\n {\"id\":\"PI17-adjustment-no-update\",\"type\":\"check\",\"table\":T,\"brief\":\"A BEFORE UPDATE trigger on stock_adjustments raises, so a direct UPDATE of any entry's timestamp, actor or quantities is refused at the DB and the row stays exactly as recorded (R1, AC5). DELETE is refused at the API (no delete route); the DB leaves DELETE open only so FK-aware test cleanup can run.\"},\n {\"id\":\"PI18-adjust-atomic\",\"type\":\"transactional\",\"table\":T,\"brief\":\"An adjustment locks the stock_records row (SELECT ... FOR UPDATE), updates its quantity and inserts the stock_adjustments entry (quantity_before = prior stored value) in ONE transaction: a rejected adjustment leaves both stock_records and stock_adjustments unchanged, and an accepted one never updates quantity without its audit entry.\"},\n {\"id\":\"PI19-create-stock-adjustments-additive-reversible\",\"type\":\"migration_reversible\",\"table\":T,\"brief\":\"Additive migration on pre-existing stock_records: upgrade creates stock_adjustments without altering stock_records; downgrade to its down_revision drops only stock_adjustments and every pre-existing stock_records row survives unchanged; upgrade head recreates stock_adjustments with its FK, checks and trigger (R1, R8).\"},\n]\na['access_patterns'].append({\"id\":\"AP3-adjustments-by-record\",\"table\":T,\"columns\":[\"stock_record_id\",\"created_at\"],\"story\":S,\"brief\":\"Equality filter WHERE stock_record_id = :id ORDER BY created_at, id for the adjustment history panel (AC4); composite btree index candidate (also serves the FK).\"})\nrec=\"{id: int, sku: string, location: string, tracking_code: string, quantity: int, par_level: int|null, batch: string|null, serial: string|null, created_at: ISO-8601, updated_at: ISO-8601}\"\nadj=\"{id: int, stock_record_id: int, actor: string, quantity_before: int, quantity_after: int, created_at: ISO-8601 (server-assigned)}\"\na['api_contracts']+= [\n {\"id\":\"EP5-adjust-stock-quantity\",\"method\":\"POST\",\"path\":\"/api/stock-records/{id}/adjustments\",\"shape\":\"object\",\"item\":f\"Request JSON {{quantity: int (the NEW absolute quantity, >= 0), actor: string (operator-typed, required, no auth)}}. 200: {{record: {rec}, adjustment: {adj}}}; record.quantity is the stored value the client reconciles its optimistic row to. 422: {{errors: [{{field: 'quantity'|'actor', message: string naming the field}}]}} when quantity < 0 / missing or actor blank; nothing written. 404 {{detail: string}} when the record id does not exist.\",\"story\":S},\n {\"id\":\"EP6-list-stock-adjustments\",\"method\":\"GET\",\"path\":\"/api/stock-records/{id}/adjustments\",\"shape\":\"list\",\"item\":f\"200: bare JSON array of {adj} for that record, ordered by created_at then id ascending (time order); [] when none (client renders history-empty). 404 {{detail}} when the record id does not exist.\",\"story\":S},\n {\"id\":\"EP7-refuse-adjustment-mutation\",\"method\":\"DELETE\",\"path\":\"/api/stock-records/{id}/adjustments/{adjustment_id}\",\"shape\":\"object\",\"item\":\"Always 405 {detail: string} (PUT and PATCH on the same path also 405 {detail}); no route mutates or deletes an audit entry, and the entry is unchanged afterwards.\",\"story\":S},\n]\na['nfrs']+= [\n {\"id\":\"NFR12-immutable-adjustment-audit\",\"brief_ref\":\"R1\",\"tier\":\"product\",\"applies_to\":S,\"hil_status\":\"accepted\",\n  \"requirement\":\"Every accepted inventory adjustment records an unmodifiable server timestamp, the caller-supplied actor, and quantity before/after in stock_adjustments, atomically with the quantity change (resolves OD1).\",\n  \"fitness_functions\":[\n   {\"clause\":\"an accepted POST /api/stock-records/{id}/adjustments writes exactly one stock_adjustments row with the submitted actor, a server created_at, and quantity_before/after equal to the prior and new stored quantity\",\"realized_by\":[\"AC1-adjust-updates-row-in-place\"]},\n   {\"clause\":\"a rejected adjustment (negative quantity or blank actor) leaves stock_records and stock_adjustments unchanged\",\"realized_by\":[\"AC2-adjust-below-zero-rejected\",\"AC3-missing-actor-named\"]},\n   {\"clause\":\"DELETE/PUT/PATCH on an adjustment entry returns 405 and a direct DB UPDATE of the entry is refused; the entry's timestamp, actor and quantities are unchanged\",\"realized_by\":[\"AC5-audit-entries-immutable\"]}]},\n {\"id\":\"NFR13-adjust-non-negative\",\"brief_ref\":\"R2\",\"tier\":\"product\",\"applies_to\":S,\"hil_status\":\"accepted\",\n  \"requirement\":\"An adjustment can never leave stock below zero: rejected at the service with a 422 naming quantity, with PI6 as DB defense in depth.\",\n  \"fitness_functions\":[{\"clause\":\"POST /api/stock-records/{id}/adjustments with quantity < 0 returns 422 naming 'quantity' and the stored quantity stays Q\",\"realized_by\":[\"AC2-adjust-below-zero-rejected\"]}]},\n {\"id\":\"NFR14-optimistic-row-update\",\"brief_ref\":\"R5\",\"tier\":\"product\",\"applies_to\":S,\"hil_status\":\"accepted\",\n  \"requirement\":\"An adjustment updates the affected row in place optimistically with no page reload, reconciles to the server-returned quantity, and reverts on rejection.\",\n  \"fitness_functions\":[\n   {\"clause\":\"submitting an adjustment shows the new value in the row's stock-cell-quantity before the response with no navigation/reload, then shows the server-returned record.quantity\",\"realized_by\":[\"AC1-adjust-updates-row-in-place\"]},\n   {\"clause\":\"a 422 rejection reverts the row's stock-cell-quantity to the stored Q and shows field-error-quantity\",\"realized_by\":[\"AC2-adjust-below-zero-rejected\"]}]},\n {\"id\":\"NFR15-adjustment-queryable-field-named\",\"brief_ref\":\"R7\",\"tier\":\"product\",\"applies_to\":S,\"hil_status\":\"accepted\",\n  \"requirement\":\"Each adjustment's timestamp + actor is queryable via EP6 in time order, and adjustment validation names the offending field.\",\n  \"fitness_functions\":[\n   {\"clause\":\"GET /api/stock-records/{id}/adjustments returns every adjustment with created_at, actor, quantity_before, quantity_after ordered by created_at ascending\",\"realized_by\":[\"AC4-adjustment-history-lookup\"]},\n   {\"clause\":\"POST /api/stock-records/{id}/adjustments with a blank actor returns 422 whose errors[] names 'actor' and the form renders it in field-error-actor\",\"realized_by\":[\"AC3-missing-actor-named\"]}]},\n {\"id\":\"NFR16-additive-adjustments-migration\",\"brief_ref\":\"R8\",\"tier\":\"product\",\"applies_to\":S,\"hil_status\":\"accepted\",\n  \"requirement\":\"The stock_adjustments migration is purely additive; existing stock_records rows survive its downgrade/upgrade and existing list/lookup/detail reads keep working.\",\n  \"fitness_functions\":[{\"clause\":\"with seeded stock_records rows, downgrading the stock_adjustments migration to its down_revision then upgrading head leaves every stock_records row unchanged and recreates stock_adjustments\",\"realized_by\":[\"AC4-adjustment-history-lookup\"]}]},\n]\nfor o in a['open_decisions']:\n  if o['id']=='OD1-adjustment-audit-trail':\n    o.update(decision_status=\"resolved\",resolved_by_story=S,resolution=\"A separate append-only stock_adjustments table (FK stock_record_id, actor typed by the operator — no auth in V1 — server created_at, quantity_before/after), written atomically with the stock_records quantity update (PI18). S1 filing/re-file does NOT write an adjustment entry, so gated S1 ACs are unaffected; stock_records stays the one row per (sku, location).\")\na['open_decisions'].append({\"id\":\"OD5-refile-audit\",\"question\":\"Should an S1 re-file that changes quantity (EP1 'updated') also append a stock_adjustments entry, or does the audit trail cover only explicit adjustments?\",\"decision_status\":\"deferred\"})\njson.dump(a,open(p,'w'),indent=2); open(p,'a').write('\\n')\nEOF","description":"Add S4 audit-trail design to architecture.json"}
- Bash {"command":"cd <PROJECT_ROOT> && F=F1-stock-visibility S=S4-adjust-quantity-in-place\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC1-adjust-updates-row-in-place --layer E2E --api-contract EP5-adjust-stock-quantity --ui-seams \"adjust-row-<sku>-<location>,adjust-quantity-<sku>-<location>,adjust-actor-<sku>-<location>,adjust-submit-<sku>-<location>,stock-cell-quantity\" --notes \"Client↔server round-trip (R5): the inline adjust form (client/src/components + hooks/api) optimistically sets the row's quantity, POSTs EP5 to the app/routes boundary, and reconciles the row to the server-returned record.quantity. app/services/stock_adjustments.py owns the transaction (PI18): repository locks the stock_records row, updates quantity and inserts the stock_adjustments entry. Verified by Playwright against the live API on the paired branch, then the stored quantity is asserted.\" && \\\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC2-adjust-below-zero-rejected --layer API --api-contract EP5-adjust-stock-quantity --notes \"Write rule (R2): app/services/stock_adjustments.py rejects a new quantity < 0 with a 422 naming 'quantity' before any write, with stock_records CHECK PI6 as defense in depth; the transaction (PI18) leaves stock_records and stock_adjustments unchanged. Verified by a branch-DB API test; the client revert-to-Q is the NFR14 rejection clause.\" && \\\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC3-missing-actor-named --layer E2E --api-contract EP5-adjust-stock-quantity --ui-seams \"adjust-actor-<sku>-<location>,adjust-submit-<sku>-<location>,field-error-actor,stock-cell-quantity\" --notes \"Server-decided rejection rendered inline: the actor is an operator-typed form field (no auth in V1); the service rejects a blank/whitespace actor with a 422 naming 'actor' (PI15 as DB backstop) and the client maps it to field-error-actor and keeps the stored quantity. Owner app/services/stock_adjustments.py; verified by Playwright against the live API plus a no-change check on both tables.\" && \\\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC4-adjustment-history-lookup --layer E2E --api-contract EP6-list-stock-adjustments --ui-seams \"history-toggle-<sku>-<location>,adjustment-history,history-entry-<n>,history-timestamp,history-actor,history-qty-before,history-qty-after\" --notes \"Client↔server read (R1, R7): the history toggle fetches EP6 from app/routes, which delegates to app/services/stock_adjustments.py and the repository query by stock_record_id ordered by created_at, id (AP3); the adjustment-history panel renders each entry's server timestamp, actor and quantity before/after. Verified by Playwright against the live API on the paired branch after seeded adjustments.\" && \\\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC5-audit-entries-immutable --layer API --api-contract EP7-refuse-adjustment-mutation --notes \"Immutability (R1): no route mutates an audit entry; DELETE/PUT/PATCH on an adjustment return 405 (EP7), the repository is insert-only for stock_adjustments, and a BEFORE UPDATE trigger (PI17) refuses a direct DB UPDATE. Verified by a branch-DB API test plus a direct-UPDATE attempt, then re-reading the entry unchanged.\"","description":"Annotate S4 ACs with layer and architectural notes"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/architecture.md","offset":25}
- Bash {"command":"cd <PROJECT_ROOT>/.consort/features/F1-stock-visibility && python3 -I - <<'EOF'\np='architecture.md'; s=open(p).read()\ns=s.replace(\"| Audit (timestamp/actor) | cross-cutting audit service (future) | deferred OD1 | actor is caller-supplied (no auth V1) |\",\n\"| Audit (timestamp/actor) | service + repository + DB | `app/services/stock_adjustments.py`, `app/repositories/stock_adjustments.py`, `app/models/stock_adjustment.py` | S4: append-only `stock_adjustments`, operator-typed actor (no auth V1), server `created_at`, UPDATE trigger + 405 on mutation (R1, OD1 resolved) |\\n| Adjustment atomicity | service | `app/services/stock_adjustments.py` | row lock + quantity update + audit insert in one transaction (PI18) |\\n| Optimistic row update | client hooks | `client/src/hooks` adjust mutation | optimistic set, reconcile to server `record.quantity`, revert on 422/error (R5) |\")\ns=s.replace(\"\\n## Risks\",\"- S4: `StockAdjustmentRepository` (insert + list_by_record, no update/delete) + service `adjust_quantity(record_id, quantity, actor)` validating quantity ≥ 0 and non-blank actor, locking the record, writing both rows; routes EP5 POST / EP6 GET / EP7 405. Client `useAdjustQuantity` (optimistic) + `useAdjustmentHistory` drive the inline `adjust-row-<sku>-<location>` and `adjustment-history` panel.\\n\\n## Risks\")\ns=s.replace(\"- R1 audit trail (OD1) likely needs a new `stock_movements` table in S4.\\n\",\n\"- S4 PI17 trigger blocks UPDATE only; DELETE is refused at the API (EP7) and left open at the DB so FK-aware test cleanup can delete adjustments before stock_records (PI11 RESTRICT).\\n- OD5 (deferred): an S1 re-file changing quantity does not write an audit entry; revisit if every quantity change must be audited.\\n- Concurrent adjustments serialize on `SELECT … FOR UPDATE`; no multi-operator conflict resolution beyond that (out of bounds).\\n\")\ns=s.replace(\"- OD1 (deferred): adjustment audit to S4; recommend a separate append-only movements table with caller-supplied actor.\",\n\"- OD1 (resolved by S4): separate append-only `stock_adjustments` table, actor typed by the operator, written atomically with the quantity update; S1 filing unaffected. Recommend accept.\\n- OD5 (deferred): whether re-file is audited. Recommend defer.\")\ns=s.replace(\"NFR6 latency fitness test on EP2 against the branch; AP1 index realized by the DBA.\",\n\"NFR6 latency fitness test on EP2 against the branch; AP1 index realized by the DBA. S4: API suite AC2, AC5 (EP5/EP7, PI11–PI19, direct-UPDATE refusal); Playwright AC1, AC3, AC4 (optimistic update, field-error-actor, adjustment-history via EP6); AP3 index by the DBA.\")\nopen(p,'w').write(s)\nEOF\ncd <PROJECT_ROOT> && ./scripts/lk consort-response-formatter --role architect-reviewer --feature F1-stock-visibility --story S4-adjust-quantity-in-place","description":"Update architecture.md with S4 audit design"}
- Bash {"command":"cd <PROJECT_ROOT>/.consort/features/F1-stock-visibility && python3 -I - <<'EOF'\nimport json\np='architecture.json'; a=json.load(open(p))\nfor n in a['nfrs']:\n  if n['id'][:5] in ('NFR12','NFR13','NFR14','NFR15','NFR16') and not n.get('fitness_function'):\n    n['fitness_function']='; '.join(c['clause'] if isinstance(c,dict) else c for c in n['fitness_functions'])\njson.dump(a,open(p,'w'),indent=2); open(p,'a').write('\\n')\nEOF\ncd <PROJECT_ROOT> && ./scripts/lk consort-response-formatter --role architect-reviewer --feature F1-stock-visibility --story S4-adjust-quantity-in-place","description":"Add summary fitness_function to new NFRs and re-check"}
- Bash {"command":"./scripts/lk consort-log --role architect-reviewer --feature F1-stock-visibility --event reasoning --message \"S4: AC1/AC3/AC4 E2E (inline adjust, field-error-actor, history panel), AC2/AC5 API write rules; OD1 resolved as append-only stock_adjustments (PI11-PI19, AP3, EP5-EP7, NFR12-16).\" 2>&1 | tail -1","description":"Log S4 layer and audit design reasoning"}

## Final reasoning

I annotated all five S4 ACs and updated `architecture.json` and `architecture.md`. The self-check passes.

- **Layers:** AC1, AC3 and AC4 are `E2E`, each with IA seam tokens. AC2 (the below-zero rule) and AC5 (entries can't be changed) are `API`.
- **OD1 resolved:** the audit trail is a new append-only `stock_adjustments` table. The actor is typed by the operator, since there is no login in V1. The timestamp is set by the server, and the entry is written in the same transaction as the quantity change. S1 filing doesn't write audit entries, so S1's ACs are unaffected.
- **Added for S4:** persistence invariants PI11–PI19, index candidate AP3, endpoints EP5–EP7, and NFR12–NFR16.
- **Delete is only blocked at the API:** a database trigger refuses any UPDATE on an audit entry. DELETE is refused by the API (405) but left open at the database so test cleanup can remove rows.
- **New open question OD5 (deferred):** should an S1 re-file that changes quantity also write an audit entry? Right now it doesn't, so a re-file can change stock without an audit record. The PO should decide at the design gate.
