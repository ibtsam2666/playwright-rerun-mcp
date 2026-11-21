# playwright-rerun-mcp

[![CI](https://github.com/ibtsam2666/playwright-rerun-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/ibtsam2666/playwright-rerun-mcp/actions/workflows/ci.yml)

An [MCP](https://modelcontextprotocol.io) server that lets an AI assistant (Claude Code, Claude Desktop, or any MCP client) see which Playwright tests failed and rerun only those, or rerun tests by test-case ID.

I built the same kind of tool at work, where it reran failed specs by their test-management ID. This is a clean, public version.

![An assistant runs the example tests, lists the failure, explains TC-3 with show_trace, then reruns TC-3 by ID after the fix](media/demo.gif)

<sub>Real replies from the server on the example suite, replayed as a terminal. Re-record with `node scripts/record-demo.mjs`.</sub>

## Add it to Claude Code

From your Playwright project root:

```bash
claude mcp add playwright-rerun -- npx -y github:ibtsam2666/playwright-rerun-mcp
```

Or add it to any MCP client config:

```json
{
  "mcpServers": {
    "playwright-rerun": {
      "command": "npx",
      "args": ["-y", "github:ibtsam2666/playwright-rerun-mcp"],
      "env": { "PLAYWRIGHT_PROJECT_ROOT": "/path/to/your/project" }
    }
  }
}
```

On Windows, start it through `cmd`: `"command": "cmd", "args": ["/c", "npx", "-y", "github:ibtsam2666/playwright-rerun-mcp"]`.

Your project needs `@playwright/test` installed (`npm ci`). The server uses your project's own Playwright and config.

## Tools

| Tool | What it does |
|---|---|
| `list_failed_tests` | Reads the last JSON report and lists failed and flaky tests with file, line, error and case IDs. Read-only |
| `show_trace` | Explains one failed test, found by case ID or title: full error, where it was thrown, the failing `test.step`, and the trace, screenshot and video paths with the `show-trace` command. Read-only |
| `list_tests` | Lists tests with their case IDs, file and project without running them (`--list`), filtered by `grep` or `project`. Read-only |
| `rerun_failed` | Reruns only the tests that failed last time, optionally filtered by title |
| `rerun_by_id` | Reruns tests by case ID, e.g. `["TC-301", "TC-405"]` |
| `run_tests` | Runs tests by title pattern, tag (`@smoke`), spec file or project |

Each tool returns a short text summary plus structured content. The run tools return `{ exitCode, timedOut, counts: { passed, failed, flaky, skipped } }`.

`show_trace` lists a trace only if the project saves one, e.g. `use: { trace: 'retain-on-failure' }` in `playwright.config`.

Case IDs come from Playwright tags or from test titles:

```ts
test('order total includes tax', { tag: ['@smoke', '@TC-301'] }, async ({ page }) => { /* ... */ });
```

## Settings

| Variable | Default | Purpose |
|---|---|---|
| `PLAYWRIGHT_PROJECT_ROOT` | current directory | The Playwright project to run |
| `RERUN_TIMEOUT_MS` | `600000` (10 min) | A run that takes longer is stopped |

The report is written to `test-results/results.json` in the project root.

## CI job summary

The package also installs `playwright-rerun-summary`, which turns a Playwright JSON report into a GitHub Actions job summary: a pass/fail/flaky/skipped table plus one row per failed or flaky test with its case IDs.

```yaml
- name: Job summary
  if: ${{ !cancelled() }}
  run: npx -y -p github:ibtsam2666/playwright-rerun-mcp playwright-rerun-summary test-results/results.json --title "UI tests"
```

## Safety

- Spec paths must stay inside the project and end in `.spec.ts` or `.spec.js`.
- Only one run at a time, so the report is never written twice at once.
- Every run has a timeout. Project names and case IDs are checked against strict patterns.

## Develop

```bash
npm ci
npm test              # unit tests: report parser, trace and listing helpers, path guard, job summary
npm run smoke         # builds, then lists, runs, explains and reruns the example suite over stdio
npm run lint          # ESLint with typescript-eslint and eslint-plugin-playwright
npm run format:check  # Prettier
```

The smoke test sets `DEMO_BREAK=1` so example test TC-3 fails on purpose and `show_trace` has something to explain.

`src/report.ts` parses the report (pure functions), `src/tools.ts` defines the tools, `src/cli.ts` starts the server and `src/summary.ts` writes the CI summary.

The same server also runs inside my [Playwright portfolio](https://github.com/ibtsam2666/IbtsamAyyaz-Portfolio) against a full UI and API suite.

## License

MIT
