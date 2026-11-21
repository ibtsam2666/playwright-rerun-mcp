# playwright-rerun-mcp

[![CI](https://github.com/ibtsam2666/playwright-rerun-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/ibtsam2666/playwright-rerun-mcp/actions/workflows/ci.yml)

An [MCP](https://modelcontextprotocol.io) server that lets an AI assistant (Claude Code, Claude Desktop, or any MCP client) see which Playwright tests failed and rerun only those, or rerun tests by test-case ID.

I built the same kind of tool at work, where it reran failed specs by their test-management ID. This is a clean, public version.

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

Your project needs `@playwright/test` installed (`npm ci`). The server uses your project's own Playwright and config.

## Tools

| Tool | What it does |
|---|---|
| `list_failed_tests` | Reads the last JSON report and lists failed and flaky tests with file, line, error and case IDs. Read-only |
| `rerun_failed` | Reruns only the tests that failed last time, optionally filtered by title |
| `rerun_by_id` | Reruns tests by case ID, e.g. `["TC-301", "TC-405"]` |
| `run_tests` | Runs tests by title pattern, tag (`@smoke`), spec file or project |

Each tool returns a short text summary plus structured content: `{ exitCode, timedOut, counts: { passed, failed, flaky, skipped } }`.

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

## Safety

- Spec paths must stay inside the project and end in `.spec.ts` or `.spec.js`.
- Only one run at a time, so the report is never written twice at once.
- Every run has a timeout. Project names and case IDs are checked against strict patterns.

## Develop

```bash
npm ci
npm test          # unit tests for the report parser and path guard
npm run smoke     # builds, starts the server over stdio, reruns example test TC-1
```

`src/report.ts` parses the report (pure functions), `src/tools.ts` defines the tools and `src/cli.ts` starts the server.

The same server also runs inside my [Playwright portfolio](https://github.com/ibtsam2666/IbtsamAyyaz-Portfolio) against a full UI and API suite.

## License

MIT
