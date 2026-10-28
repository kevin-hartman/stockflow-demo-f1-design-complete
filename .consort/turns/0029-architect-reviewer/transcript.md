# architect-reviewer (architect-reviewer) – opus

## Prompt

```
Annotate story S3-view-stock-list-and-sku-detail's acceptance criteria + nfrs.md coverage. Author architectural_notes for ALL of story S3-view-stock-list-and-sku-detail's ACs: AC1-home-list-shows-every-record, AC2-sku-detail-shows-all-its-locations, AC3-list-and-detail-show-not-tracked, AC4-empty-list-shows-empty-state. Every one of this story's ACs MUST end up with a non-empty "architectural_notes" field in its acs/<AC>.json (the layer it lives in + how it realizes the design) — the design gate verifies that, and the spec-author's "layer" field does NOT count. architectural_notes are per-AC, so author the scoped ACs above even when the feature-level architecture.json already exists from an earlier story. For every E2E AC, ALSO pass consort-annotate-ac --ui-seams with the ia.md data-testid seam token(s) the AC's UI drives — the column / cell / region / empty-state / form field it asserts (e.g. "stock-cell-tracking,stock-not-tracked"). A deterministic gate checks each seam is named in <PROJECT_ROOT>/.consort/design/ia.md; if the AC needs a surface the IA does not yet name, declare the seam you need anyway and the gate routes the ux-designer to add it to ia.md. In architecture.json, make an EXPLICIT service_backed call (required): set service_backed:true if the feature persists data (a DB table/migration) or carries business logic, and then you MUST declare boundary, service, and repository layers (plus a "models" PACKAGE app/models/, one module per domain object, NOT a flat app/models.py, when it persists entities); set false ONLY for a trivial static/read-through endpoint. An Infra-layer AC or a migration/schema/storage NFR while service_backed is false hard-blocks the gate. When service_backed:true you MUST also declare architecture.json persistence_invariants[]: the DB-level guarantees the schema enforces (each with id, type one of unique|foreign_key|cascade|not_null|check|transactional|migration_reversible, table, and a one-line brief), covering unique/composite keys, foreign keys + cascade rules, NOT NULL / CHECK constraints, any transactional-atomicity boundary, and migration reversibility. The test-strategist must cover each with a real-branch test; a service_backed feature with no persistence_invariants hard-blocks the gate. When THIS story introduces a NEW read/query shape over the schema — a filter, lookup, sort, or join an AC drives (e.g. "list stock filtered by location", "look up a SKU's rows by sku") that is an INDEX candidate — declare it in architecture.json access_patterns[] (id, a one-line brief, and the table + column(s) it reads) so the DBA is pulled back in to reconsider the physical design for it; this is how a later READ story evolves the schema, since a story that adds no persistence_invariant would otherwise skip the DBA. Declare an access_pattern ONLY for a genuinely new query shape (not for every read, and not for one already covered by a prior story's pattern or a primary-key lookup). REUSE the established project architecture conventions (set by F1-stock-visibility): boundary=app/routes (react), service=app/services, repository=app/repositories, models=app/models, infrastructure=app/database.py. Declare the SAME role -> module paths in architecture.json, do NOT remap or rename an established layer; a divergent layout hard-blocks the spec gate and mismatches the inherited code. Author this story's architectural_notes FRESH from the ACs + IA on disk this turn. On a reflect-revise re-run the self-heal clears this story's prior architectural_notes BY DESIGN, so an absent/empty prior is the expected revise state — re-derive against the corrected ACs + IA. Write every artifact under the ABSOLUTE artifact root <PROJECT_ROOT>/.consort (this feature: <PROJECT_ROOT>/.consort/features/F1-stock-visibility/; this story: <PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-view-stock-list-and-sku-detail/); use that absolute path and never resolve or guess the project root yourself.CROSS-STORY CONTEXT — this story is NOT reviewed in isolation. The feature's OTHER stories' ACs, the architecture's open_decisions, and its mandated (not-null) persistence fields are below; use them for the cross-story checks (an AC contradicting a gated sibling AC; a mandated field no sibling submit AC supplies). This IS that context — do not run `consort-cross-story-context` yourself.

{
  "current_story": "S3-view-stock-list-and-sku-detail",
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

- Bash {"command":"cd <PROJECT_ROOT>/.consort && for f in features/F1-stock-visibility/stories/S3-view-stock-list-and-sku-detail/acs/*.json; do cat $f; echo; done; sed -n 1,30p design/ia.md | grep -n -i \"stock-\\|sku-\\|empty\\|not-tracked\"; python3 -c \"\nimport json;a=json.load(open('features/F1-stock-visibility/architecture.json'));print(list(a.keys()));print(json.dumps([n for n in a['nfrs'] if n['id'] in('NFR9-optional-detail-absent','NFR10-lookup-not-tracked-render')],indent=1))\"","description":"Read S3 ACs, IA seams, architecture keys"}
- Bash {"command":"cd <PROJECT_ROOT>/.consort/features/F1-stock-visibility && python3 - <<'EOF'\nimport json\np='architecture.json';a=json.load(open(p))\nS='S3-view-stock-list-and-sku-detail'\nrec=\"{id: int, sku: string, location: string, tracking_code: string, quantity: int, par_level: int|null, batch: string|null, serial: string|null, created_at: ISO-8601, updated_at: ISO-8601}\"\nids={c['id'] for c in a['api_contracts']}\nfor c in [\n {\"id\":\"EP3-list-stock-records\",\"method\":\"GET\",\"path\":\"/api/stock-records\",\"shape\":\"list\",\"item\":f\"200: bare JSON array of stock records {rec}, one per (sku, location), ordered by sku then location; [] when no rows exist (client renders stock-empty).\",\"story\":S},\n {\"id\":\"EP4-sku-stock-records\",\"method\":\"GET\",\"path\":\"/api/skus/{sku}/stock-records\",\"shape\":\"list\",\"item\":f\"200: bare JSON array of the stock records {rec} whose sku equals the path sku, ordered by location; [] when the SKU has no records (client renders sku-not-found).\",\"story\":S}]:\n  if c['id'] not in ids: a['api_contracts'].append(c)\nif not any(x['id']=='AP2-records-by-sku' for x in a['access_patterns']):\n  a['access_patterns'].append({\"id\":\"AP2-records-by-sku\",\"table\":\"stock_records\",\"columns\":[\"sku\"],\"story\":S,\"brief\":\"Equality filter WHERE sku = :sku ORDER BY location for the SKU detail view; likely served by the leading column of the (sku, location) unique index (PI1), so the DBA may record a deliberate no-new-index decision.\"})\nif not any(n['id']=='NFR11-list-detail-not-tracked-render' for n in a['nfrs']):\n  a['nfrs'].append({\"id\":\"NFR11-list-detail-not-tracked-render\",\"brief_ref\":\"R9\",\"tier\":\"product\",\"applies_to\":S,\"requirement\":\"Stock list and SKU detail render absent optional detail as an explicit 'not tracked' (R9 reader side for S3; NFR9 covers storage).\",\"fitness_functions\":[\n   {\"clause\":\"a stock-table row whose par_level, batch and serial are NULL renders 'not tracked' in stock-cell-par-level/-batch/-serial, never blank or a crash\",\"realized_by\":[\"AC3-list-and-detail-show-not-tracked\"]},\n   {\"clause\":\"a sku-locations row whose par_level, batch and serial are NULL renders 'not tracked' in sku-location-par-level/-batch/-serial, never blank or a crash\",\"realized_by\":[\"AC3-list-and-detail-show-not-tracked\"]}],\"hil_status\":\"accepted\"})\njson.dump(a,open(p,'w'),indent=2)\nEOF\ngrep -n \"^#\" architecture.md","description":"Add S3 contracts, access pattern, NFR to architecture.json"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/architecture.md","offset":47}
- Bash {"command":"python3 - <<'EOF'\np='architecture.md';t=open(p).read()\nt=t.replace(\"- R1 audit trail (OD1) likely needs a new `stock_movements` table in S4.\\n\",\"- R1 audit trail (OD1) likely needs a new `stock_movements` table in S4.\\n- S3 EP3 returns the whole table unpaginated; fine for a single warehouse in V1, revisit with pagination if row counts grow.\\n- AP2 (by sku) is expected to ride the leading column of the PI1 (sku, location) unique index; DBA to confirm or add an index.\\n\")\nt=t.replace(\"S2 AC1–AC4 (EP2 lookup).\",\"S2 AC1–AC4 (EP2 lookup); S3 AC1–AC4 (EP3 list, EP4 SKU detail, NFR11 not-tracked render, stock-empty).\")\nopen(p,'w').write(t)\nEOF\ncd <PROJECT_ROOT> && F=F1-stock-visibility S=S3-view-stock-list-and-sku-detail\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC1-home-list-shows-every-record --layer E2E --api-contract EP3-list-stock-records --ui-seams \"stock-table,stock-row-<sku>-<location>,stock-cell-sku,stock-cell-location,stock-cell-tracking-code,stock-cell-quantity\" --notes \"Client↔server read: the Stock home page (client/src/pages + hooks/api) fetches EP3 from the app/routes boundary, which delegates to app/services/stock_records.py and the repository list query; one stock-table row per (sku, location) row returned. Verified by Playwright against the live API on the paired branch with a SKU seeded at two locations.\" &&\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC2-sku-detail-shows-all-its-locations --layer E2E --api-contract EP4-sku-stock-records --ui-seams \"stock-link-<sku>,sku-detail,sku-detail-title,sku-locations,sku-location-row-<location>,sku-location-location,sku-location-quantity,sku-location-tracking-code\" --notes \"Client↔server read: the stock-link navigates to /skus/:sku, whose page fetches EP4; the service filters by sku via the repository (AP2, served by the PI1 index prefix) so only that SKU's rows render in sku-locations. Verified by Playwright against the live API on the paired branch with other SKUs seeded as distractors.\" &&\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC3-list-and-detail-show-not-tracked --layer E2E --api-contract EP3-list-stock-records --ui-seams \"stock-cell-par-level,stock-cell-batch,stock-cell-serial,not-tracked,sku-location-par-level,sku-location-batch,sku-location-serial\" --notes \"R9/NFR11 reader side: NULL par_level/batch/serial (stored absent per S1 AC3/NFR9) arrive as null in EP3 and EP4 rows, and the list cells and detail cells both render 'not tracked', never blank. Verified by Playwright against the live API on the paired branch with a seeded row whose optional columns are NULL.\" &&\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC4-empty-list-shows-empty-state --layer E2E --api-contract EP3-list-stock-records --ui-seams \"stock-empty,empty-state\" --notes \"Server-decided empty outcome: EP3 returns [] when stock_records has no rows, and the Stock home renders the stock-empty empty state with the File stock CTA instead of a blank table or error. Verified by Playwright against the live API on the paired branch after cleanup leaves the table empty.\" &&\n./scripts/lk consort-response-formatter --role architect-reviewer --feature $F --story $S","description":"Update architecture.md, annotate S3 ACs, self-check"}
- Bash {"command":"python3 - <<'EOF'\nimport json\np='architecture.json';a=json.load(open(p))\nfor n in a['nfrs']:\n  if n['id']=='NFR11-list-detail-not-tracked-render':\n    n['fitness_function']=\"viewing a record whose par_level, batch and serial are NULL renders 'not tracked' in both the stock-table cells and the sku-locations cells, never blank or a crash\"\njson.dump(a,open(p,'w'),indent=2)\nEOF\ncd <PROJECT_ROOT> && ./scripts/lk consort-response-formatter --role architect-reviewer --feature F1-stock-visibility --story S3-view-stock-list-and-sku-detail","description":"Add NFR11 fitness_function and re-run self-check"}

## Final reasoning

I annotated all four S3 acceptance criteria as E2E with seams named in `ia.md`, and the self-check passes. In `architecture.json` I added:
- **Two new API contracts:** the full stock list (EP3) and one SKU's records (EP4). Both return a plain list, empty when there are no rows.
- **AP2:** a new query pattern for looking up records by SKU. This brings the database designer back in. The existing unique (sku, location) index should already cover it, so they may just record that no new index is needed.
- **NFR11:** the list and SKU detail views show "not tracked" for missing par level, batch and serial. This covers requirement R9 for this story.

I added two risks to `architecture.md` (the stock list has no pagination for V1, and the AP2 index question) and listed S3's tests in its test strategy.
