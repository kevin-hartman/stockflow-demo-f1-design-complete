// Consort per-test "green as it runs" reporter for Vitest (client component/hook tests).
//
// Mirrors the Playwright reporter: a test whose name carries `@T<id>` streams its lifecycle to
// `.consort/test-run.jsonl` so the Consort dashboard lights that bubble. Reuses the single
// `emitTestRun` writer from the shared Playwright reporter one directory up (`../consort-test-reporter`)
// — one writer, one JSONL shape, one `.consort` resolver.
//
// Recent Vitest (the "Reported Tasks" reporter API, v2.1+) fires per-test hooks, so we stream
// `running` the moment a test starts and the final status when it ends. OLDER Vitest does not fire
// those hooks — so `onFinished` is a BATCH BACKSTOP that emits any test the per-test hooks did not
// already handle (tracked in `handled`), giving a correct end-of-run signal on any version. Typed
// structurally (not against vitest's own types) so a vitest major bump can't break the build;
// everything is wrapped so a reporter error can never fail the suite.
import { emitTestRun, type TestRunStatus } from "../consort-capture";

const TEST_ID = /@(T\d+(?:-[a-z0-9-]+)?)/;

// NOTE: per-test TABLE-STATE capture does NOT live here — it is in `tests/setup.ts`'s afterEach,
// which runs in the WORKER process where the booted backend's base URL (`.consort/.vitest-backend`)
// actually resolves. This reporter runs in the MAIN process, where that base did not resolve, so a
// capture here silently no-op'd. This reporter is purely the per-test STATUS stream (test-run.jsonl).

function idOf(name: string | undefined): string | undefined {
  return TEST_ID.exec(name ?? "")?.[1];
}

function stateToStatus(state: string | undefined): TestRunStatus {
  return state === "pass" || state === "passed" ? "green" : state === "skip" || state === "skipped" ? "skipped" : "red";
}

// --- Modern "Reported Tasks" shapes (duck-typed) ---------------------------------------------
interface ReportedTestCase {
  name?: string;
  module?: { moduleId?: string; id?: string };
  result?: (() => { state?: string } | undefined) | { state?: string };
}

function moduleIdOf(tc: ReportedTestCase): string {
  return tc.module?.moduleId ?? tc.module?.id ?? "";
}

function resultStateOf(tc: ReportedTestCase): string | undefined {
  const r = typeof tc.result === "function" ? tc.result() : tc.result;
  return r?.state;
}

// --- Legacy onFinished task tree (duck-typed) ------------------------------------------------
interface VitestTaskLike {
  type?: string;
  name?: string;
  mode?: string;
  result?: { state?: string };
  tasks?: VitestTaskLike[];
  filepath?: string;
}

export default class ConsortVitestReporter {
  // Keys (`file\0name`) already emitted by the per-test hooks, so the onFinished backstop skips
  // them on recent Vitest and only fires for versions where the per-test hooks never ran.
  private handled = new Set<string>();

  onTestCaseReady(testCase: ReportedTestCase): void {
    const id = idOf(testCase.name);
    if (id) emitTestRun(id, "running", moduleIdOf(testCase), "client");
  }

  onTestCaseResult(testCase: ReportedTestCase): void {
    const id = idOf(testCase.name);
    if (!id) return;
    const file = moduleIdOf(testCase);
    this.handled.add(`${file}\u0000${testCase.name ?? ""}`);
    emitTestRun(id, stateToStatus(resultStateOf(testCase)), file, "client");
  }

  onFinished(files: VitestTaskLike[] = []): void {
    try {
      for (const f of files) this.walk(f, f.filepath ?? "");
    } catch {
      /* best-effort: a per-test reporter write must never fail the suite */
    }
  }

  private walk(task: VitestTaskLike, file: string): void {
    const isLeaf = task.type === "test" || task.type === "custom" || (!task.tasks && !!task.result);
    if (isLeaf) {
      const id = idOf(task.name);
      if (!id) return;
      if (this.handled.has(`${file}\u0000${task.name ?? ""}`)) return; // already streamed by the per-test hooks
      const st = task.result?.state;
      const status: TestRunStatus = st === "pass" ? "green" : st === "skip" || task.mode === "skip" ? "skipped" : "red";
      emitTestRun(id, status, file, "client");
      return;
    }
    for (const child of task.tasks ?? []) this.walk(child, file);
  }
}
