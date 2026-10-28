// Consort e2e test fixture: tag every spec's browser requests with the X-Consort-Test-Id header,
// derived from the test title's @T<id>. The backend's per-test capture (app/consort_capture.py) uses
// it to attribute the rows this spec RETRIEVES/STORES — the same per-test key the Vitest fetch shim
// and the pytest client fixture set, so the dashboard's per-test table view works for e2e specs too.
//
// Import { test, expect } from THIS module in e2e specs instead of "@playwright/test" — nothing else
// changes. (The header rides through Vite's /api proxy to the backend; it's inert in production.)
import { test as base } from "@playwright/test";

// Re-export EVERYTHING from @playwright/test (expect, devices, types like APIRequestContext, …) so a
// spec imports solely from here; the local `test` below overrides the re-exported one (an explicit
// export shadows a star re-export of the same name).
export * from "@playwright/test";

const TEST_ID = /@(T\d+(?:-[a-z0-9-]+)?)/;

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const id = TEST_ID.exec(testInfo.title)?.[1];
    if (id) await page.setExtraHTTPHeaders({ "X-Consort-Test-Id": id });
    await use(page);
  },
});
