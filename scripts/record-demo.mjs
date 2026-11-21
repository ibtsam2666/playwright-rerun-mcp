/* global process, console, document */
/**
 * Records media/demo.gif for the README from a real session against the example suite:
 *   run_tests -> list_failed_tests -> show_trace TC-3 -> (fix) -> rerun_by_id TC-3
 * The replies are the server's real output; the page only replays them as a terminal.
 * Needs a build (npm run build) and ffmpeg on PATH:   node scripts/record-demo.mjs
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

async function session(demoBreak, calls) {
  const client = new Client({ name: 'demo-recorder', version: '1.0.0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [path.join(root, 'dist', 'cli.js')],
      cwd: root,
      env: { ...process.env, DEMO_BREAK: demoBreak },
    }),
  );
  const out = [];
  for (const [prompt, name, args, keep] of calls) {
    const r = await client.callTool({ name, arguments: args });
    const lines = r.content[0].text.split('\n');
    out.push({ prompt, call: `${name} ${JSON.stringify(args)}`, reply: (keep ? lines.slice(0, keep) : lines).join('\n').trim() });
  }
  await client.close();
  return out;
}

const steps = [
  ...(await session('1', [
    ['Run the example tests', 'run_tests', { project: 'example' }, 1],
    ['Which tests failed?', 'list_failed_tests', {}, 0],
    ['Why did TC-3 fail?', 'show_trace', { test: 'TC-3' }, 0],
  ])),
  // The discount bug is "fixed" (DEMO_BREAK off) before the rerun.
  ...(await session('0', [['Fixed it. Rerun just TC-3', 'rerun_by_id', { ids: ['TC-3'] }, 2]])),
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#0d1117;font:15px/1.45 Consolas,'Cascadia Mono',monospace;color:#c9d1d9}
  .bar{background:#161b22;padding:8px 14px;color:#8b949e;font:13px system-ui,sans-serif;border-bottom:1px solid #30363d}
  #t{padding:12px 16px;height:${560 - 37 - 24}px;overflow:hidden;white-space:pre-wrap}
  .p{color:#58a6ff}.c{color:#d2a8ff}.r{color:#c9d1d9}.ok{color:#3fb950}.bad{color:#f85149}
</style><div class="bar">playwright-rerun MCP server · real replies from the example suite</div><div id="t"></div>
<script>
const steps = ${JSON.stringify(steps.map((s) => ({ ...s, reply: esc(s.reply) })))};
const t = document.getElementById('t');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const add = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; t.appendChild(d); t.scrollTop = t.scrollHeight; return d; };
const paint = (s) => s.replace(/\\b(passed \\d+|Exit code 0)/g, '<span class="ok">$1</span>').replace(/(\\[failed\\]|failed [1-9]\\d*|Received: [\\d.]+)/g, '<span class="bad">$1</span>');
(async () => {
  await wait(400);
  for (const s of steps) {
    const p = add('p', '› ');
    for (const ch of s.prompt) { p.textContent += ch; await wait(35); }
    await wait(350);
    add('c', '  ⚙ ' + s.call);
    await wait(600);
    for (const line of s.reply.split('\\n')) { add('r', '  ' + paint(line) || ' '); await wait(45); }
    add('r', ' ');
    await wait(1600);
  }
  await wait(1500);
  document.title = 'done';
})();
</script>`;

const work = mkdtempSync(path.join(tmpdir(), 'demo-'));
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 900, height: 560 }, recordVideo: { dir: work, size: { width: 900, height: 560 } } });
const page = await context.newPage();
await page.setContent(html);
await page.waitForFunction(() => document.title === 'done', null, { timeout: 120_000 });
await context.close();
await browser.close();

const video = path.join(
  work,
  readdirSync(work).find((f) => f.endsWith('.webm')),
);
mkdirSync(path.join(root, 'media'), { recursive: true });
const gif = path.join(root, 'media', 'demo.gif');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-vf', 'fps=10,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=none', gif]);
rmSync(work, { recursive: true, force: true });
console.log(`Wrote ${path.relative(root, gif)} from ${steps.length} real tool calls.`);
