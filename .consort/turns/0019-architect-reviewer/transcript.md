# architect-reviewer (architect-reviewer) – opus

## Prompt

```
REVISE (Product Owner): blocking smell "reflect-ia-defect": ia conformance: AC AC1-lookup-shows-matching-record drives UI seam(s) the information architecture (ia.md) does not name: lookup-result-location, lookup-result-tracking-code, lookup-result-quantity. Add the surface (and its data-testid seam) to the AC's screen in ia.md, OR — if the capability has no standalone surface — reconsider the AC's layer with the spec-author. The architect declared these seams in the AC's ui_seams; every one must have a home in the IA before the build drives a UI the IA never described.; AC AC4-found-record-shows-not-tracked drives UI seam(s) the information architecture (ia.md) does not name: lookup-result-batch, lookup-result-serial. Add the surface (and its data-testid seam) to the AC's screen in ia.md, OR — if the capability has no standalone surface — reconsider the AC's layer with the spec-author. The architect declared these seams in the AC's ui_seams; every one must have a home in the IA before the build drives a UI the IA never described.

Re-author this story's architectural annotations + architecture.json to address the above. Do NOT re-emit the same overlap/redundancy; if no honest, not-already-delivered behavior remains, say so as an open question rather than fabricating one.

Annotate story S2-find-by-tracking-code's acceptance criteria + nfrs.md coverage. Author architectural_notes for ALL of story S2-find-by-tracking-code's ACs: AC1-lookup-shows-matching-record, AC2-scan-to-screen-under-200ms, AC3-unknown-code-shows-not-found, AC4-found-record-shows-not-tracked. Every one of this story's ACs MUST end up with a non-empty "architectural_notes" field in its acs/<AC>.json (the layer it lives in + how it realizes the design) — the design gate verifies that, and the spec-author's "layer" field does NOT count. architectural_notes are per-AC, so author the scoped ACs above even when the feature-level architecture.json already exists from an earlier story. For every E2E AC, ALSO pass consort-annotate-ac --ui-seams with the ia.md data-testid seam token(s) the AC's UI drives — the column / cell / region / empty-state / form field it asserts (e.g. "stock-cell-tracking,stock-not-tracked"). A deterministic gate checks each seam is named in <PROJECT_ROOT>/.consort/design/ia.md; if the AC needs a surface the IA does not yet name, declare the seam you need anyway and the gate routes the ux-designer to add it to ia.md. In architecture.json, make an EXPLICIT service_backed call (required): set service_backed:true if the feature persists data (a DB table/migration) or carries business logic, and then you MUST declare boundary, service, and repository layers (plus a "models" PACKAGE app/models/, one module per domain object, NOT a flat app/models.py, when it persists entities); set false ONLY for a trivial static/read-through endpoint. An Infra-layer AC or a migration/schema/storage NFR while service_backed is false hard-blocks the gate. When service_backed:true you MUST also declare architecture.json persistence_invariants[]: the DB-level guarantees the schema enforces (each with id, type one of unique|foreign_key|cascade|not_null|check|transactional|migration_reversible, table, and a one-line brief), covering unique/composite keys, foreign keys + cascade rules, NOT NULL / CHECK constraints, any transactional-atomicity boundary, and migration reversibility. The test-strategist must cover each with a real-branch test; a service_backed feature with no persistence_invariants hard-blocks the gate. When THIS story introduces a NEW read/query shape over the schema — a filter, lookup, sort, or join an AC drives (e.g. "list stock filtered by location", "look up a SKU's rows by sku") that is an INDEX candidate — declare it in architecture.json access_patterns[] (id, a one-line brief, and the table + column(s) it reads) so the DBA is pulled back in to reconsider the physical design for it; this is how a later READ story evolves the schema, since a story that adds no persistence_invariant would otherwise skip the DBA. Declare an access_pattern ONLY for a genuinely new query shape (not for every read, and not for one already covered by a prior story's pattern or a primary-key lookup). REUSE the established project architecture conventions (set by F1-stock-visibility): boundary=app/routes (react), service=app/services, repository=app/repositories, models=app/models, infrastructure=app/database.py. Declare the SAME role -> module paths in architecture.json, do NOT remap or rename an established layer; a divergent layout hard-blocks the spec gate and mismatches the inherited code. Author this story's architectural_notes FRESH from the ACs + IA on disk this turn. On a reflect-revise re-run the self-heal clears this story's prior architectural_notes BY DESIGN, so an absent/empty prior is the expected revise state — re-derive against the corrected ACs + IA. Write every artifact under the ABSOLUTE artifact root <PROJECT_ROOT>/.consort (this feature: <PROJECT_ROOT>/.consort/features/F1-stock-visibility/; this story: <PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S2-find-by-tracking-code/); use that absolute path and never resolve or guess the project root yourself.CROSS-STORY CONTEXT — this story is NOT reviewed in isolation. The feature's OTHER stories' ACs, the architecture's open_decisions, and its mandated (not-null) persistence fields are below; use them for the cross-story checks (an AC contradicting a gated sibling AC; a mandated field no sibling submit AC supplies). This IS that context — do not run `consort-cross-story-context` yourself.

{
  "current_story": "S2-find-by-tracking-code",
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

- Bash {"command":"grep -n -i \"lookup\\|find\\|tracking\\|not-tracked\\|not-found\\|scan\" .consort/design/ia.md | head -80; ls .consort/features/F1-stock-visibility/stories/S2-find-by-tracking-code/acs/","description":"Find lookup seams in IA and list S2 ACs"}
- Bash {"command":"cd <PROJECT_ROOT>/.consort/features/F1-stock-visibility && for f in stories/S2-find-by-tracking-code/acs/*.json; do cat $f; echo; done; python3 -c \"\nimport json;a=json.load(open('architecture.json'));print(json.dumps({k:a[k] for k in a if k in('api_contracts','access_patterns','service_backed')},indent=1));print([n['id'] for n in a['nfrs']])\"","description":"Read S2 ACs and existing architecture contracts"}
- Bash {"command":"cd <PROJECT_ROOT> && F=F1-stock-visibility S=S2-find-by-tracking-code\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC1-lookup-shows-matching-record --layer E2E --api-contract EP2-lookup-by-tracking-code --ui-seams \"lookup-input,lookup-submit,lookup-result,lookup-result-sku,lookup-result-location,lookup-result-tracking-code,lookup-result-quantity\" --notes \"Client↔server round-trip: the Stock home scan zone (client/src/pages + hooks/api) calls the app/routes lookup boundary, which delegates to app/services/stock_records.py and the repository's tracking_code query (AP1); the lookup-result card renders the server's record. Verified by Playwright against the live API on the paired branch with a seeded stock_records row.\" &&\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC2-scan-to-screen-under-200ms --layer E2E --api-contract EP2-lookup-by-tracking-code --ui-seams \"lookup-input,lookup-result\" --notes \"Performance contract R6/NFR6: scan (Enter in lookup-input) to lookup-result visible within ~200ms, served by the indexed tracking_code lookup (AP1) with no full page reload. Measured by a Playwright timing assertion against the live API on the paired branch; owner app/services/stock_records.py + app/repositories/stock_records.py.\" &&\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC3-unknown-code-shows-not-found --layer E2E --api-contract EP2-lookup-by-tracking-code --ui-seams \"lookup-input,lookup-submit,lookup-not-found\" --notes \"Server-decided not-found outcome: the service returns none, the route maps it to the EP2 404 body, and the client renders the lookup-not-found empty state naming U, never an error page. Verified by Playwright against the live API on the paired branch with no matching row.\" &&\n./scripts/lk consort-annotate-ac --feature $F --story $S --ac AC4-found-record-shows-not-tracked --layer E2E --api-contract EP2-lookup-by-tracking-code --ui-seams \"lookup-result,lookup-result-par-level,lookup-result-batch,lookup-result-serial\" --notes \"R9/NFR10: NULL par_level/batch/serial (stored absent by S1 AC3) arrive as null in the EP2 record and the lookup-result presentation renders 'not tracked' for each, never blank. Verified by Playwright against the live API on the paired branch with a seeded row whose optional columns are NULL.\" &&\n./scripts/lk consort-response-formatter --role architect-reviewer --feature $F --story $S","description":"Annotate S2 ACs and run self-check"}

## Final reasoning

I re-annotated all four S2 acceptance criteria as E2E on endpoint EP2, and the response-formatter self-check now passes. The flagged seams already appear in the current `ia.md`, so I kept the same seam names and changed nothing in `architecture.json` (EP2, access pattern AP1 and the NFRs still apply).
