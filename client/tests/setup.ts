// Vitest setup: extends expect() with jest-dom matchers and clears the DOM between tests.
//
// Kit principle — never mock when a real counterpart exists: component tests hit the REAL backend
// over the REAL `/api` boundary. jsdom has no origin, so a relative `fetch("/api/stock")` throws
// "Failed to parse URL"; this shim prefixes relative `/api` + `/health` with the backend the global
// setup (`vitest.globalSetup.ts`) booted and published to `.consort/.vitest-backend`. The component
// still only speaks HTTP — it never touches the DB. When no backend was booted (no base file) the
// shim is inert, so a pure-presentation component test is unaffected.
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { captureTablesFromRoute } from "../../consort-capture";

const TEST_ID = /@(T\d+(?:-[a-z0-9-]+)?)/;

// The @T<id> of the test currently running, so the fetch shim can tag each /api request with it (the
// backend attributes the rows the request RETRIEVES/STORED to this test — app/consort_capture.py).
let currentTestId: string | null = null;
beforeEach((ctx: { task?: { name?: string } }) => {
  currentTestId = TEST_ID.exec(ctx?.task?.name ?? "")?.[1] ?? null;
});

function backendBase(): string {
  let d = process.cwd();
  for (let i = 0; i < 8; i++) {
    try {
      return readFileSync(join(d, ".consort", ".vitest-backend"), "utf8").trim();
    } catch {
      /* walk up to the project root */
    }
    const up = dirname(d);
    if (up === d) break;
    d = up;
  }
  return "";
}

const BACKEND_BASE = backendBase();
if (BACKEND_BASE) {
  const realFetch = globalThis.fetch.bind(globalThis);
  const isApi = (u: string): boolean => u.startsWith("/api") || u.startsWith("/health");
  const reroute = (url: string): string => (isApi(url) ? BACKEND_BASE + url : url);
  // Add the X-Consort-Test-Id header to each /api request so the backend's per-test capture can key
  // the rows this request reads/writes to the running test.
  const tag = (url: string, init?: RequestInit): RequestInit | undefined => {
    if (!currentTestId || !isApi(url)) return init;
    const headers = new Headers(init?.headers);
    headers.set("X-Consort-Test-Id", currentTestId);
    return { ...init, headers };
  };
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string") return realFetch(reroute(input), tag(input, init));
    if (input instanceof URL) {
      const u = input.toString();
      return realFetch(reroute(u), tag(u, init));
    }
    if (input instanceof Request && input.url.startsWith("/")) {
      const r = new Request(reroute(input.url), input);
      if (currentTestId && isApi(input.url)) r.headers.set("X-Consort-Test-Id", currentTestId);
      return realFetch(r, init);
    }
    return realFetch(input, init);
  }) as typeof fetch;
}

// Per-test table-state capture lives HERE (the worker), not in the reporter: `BACKEND_BASE` is
// resolved in the worker after globalSetup booted the backend (same read the shim above proved
// works), whereas the reporter runs in the MAIN process where that base did not resolve — so the
// reporter's capture silently no-op'd. Running it in afterEach is also version-independent (always
// fires) and has the current test in context. Captures the DB state THIS component test left, keyed
// by its @T<id>, via the app's snapshot route (shared writer with the pytest/Playwright reporters).
afterEach(async (ctx: { task?: { name?: string; file?: { filepath?: string } } }) => {
  cleanup();
  vi.restoreAllMocks();
  if (!BACKEND_BASE) return;
  const id = TEST_ID.exec(ctx?.task?.name ?? "")?.[1];
  if (!id) return;
  try {
    await captureTablesFromRoute(BACKEND_BASE, id, ctx?.task?.file?.filepath ?? "");
  } catch {
    /* best-effort: a snapshot write must never fail the test */
  }
});
