# StockFlow – F1 design-complete snapshot

## What this is

A **ready-to-build snapshot** of StockFlow, a warehouse-management app for a mid-market
operation that has outgrown spreadsheets. **V1** lets the team see and adjust stock at one
warehouse – file, find, view, and adjust a SKU's stock by location – as a React single-page
client on a JSON API.

It's built with **[Consort](https://github.com/databricks-solutions/consort)**, a spec-first,
test-driven agent framework for apps on **Lakebase** (Databricks serverless Postgres). Consort
normally walks a feature through two lanes: a *design* lane (plan → spec → UX → architecture →
tests) and a *build* lane (TDD: RED → GREEN → REFACTOR).

**The purpose of this repo is to skip the design lane and go straight to build.** The planning
and the entire F1 design lane are already authored and frozen at their gates – so you can
stand this up as your own project and start the TDD build loop immediately, without redoing
any of the up-front design work.

## Where we are

Design is complete; no build code has been written yet.

- **Planning:** complete. Sprint `v1` is locked.
- **Feature F1 – "Stock visibility":** design complete – feature-spec, UX design-guide,
  architecture, db-design, and the ordered test-list are all authored and gated (in `.consort/`).
  All four stories are at an approved spec gate, ready to build:
  - `S1-file-stock-record` – file a stock record for a SKU at a location with a tracking code
  - `S2-find-by-tracking-code` – find a stock record by scanning or typing its tracking code
  - `S3-view-stock-list-and-sku-detail` – see the home stock list and a SKU detail across all its locations
  - `S4-adjust-quantity-in-place` – adjust a record's quantity and see the row update in place without reload

## How to use it – jump straight to build

**Prerequisite:** Consort is installed, your environment is prepped, and access to a Lakebase
profile is ready to go. If you haven't set that up yet, run:

```bash
bash <(curl -sL https://tinyurl.com/consort-bootstrap)
```

If you need Lakebase, you can try it on [Free Edition](https://login.databricks.com/signup?intent=SIGN_UP&provider=DB_FREE_TIER).

### 1. Clone it down

```bash
git clone https://github.com/kevin-hartman/stockflow-demo-f1-design-complete.git
cd stockflow-demo-f1-design-complete
git checkout feature-f1-stock-visibility
(cd client && npm install)
```

`feature-f1-stock-visibility` is the branch carrying the F1 design state; the last line
installs the UI client dependencies.

### 2. Stand it up as *your* project

Run the setup script, replacing `my-stockflow` with your own project name:

```bash
./setup.sh my-stockflow
```

If you encounter problems, read the [runbook](RUNBOOK-rehydrate-as-new-project.md) and share it with a Claude session to resolve.

### 3. Build the first feature

In your Claude session, start the workflow:

```
/consort:start
```

`/consort:start` picks up at the build lane and prompts you to build F1. It runs the
Driver/Navigator TDD loop (RED → GREEN → REFACTOR) against F1's Lakebase branch.
