/**
 * End-to-end check: starts the built server over stdio the way an MCP client would and walks
 * through a real session on the example suite, with DEMO_BREAK=1 so one test fails:
 * list_tests -> run_tests -> list_failed_tests -> show_trace -> rerun_by_id.   npm run smoke
 * With --transcript it prints each call and reply in full (used to record the README demo).
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';

const full = process.argv.includes('--transcript');
type Reply = { content: { text: string }[]; structuredContent?: Record<string, any> };

async function main() {
  const client = new Client({ name: 'smoke-client', version: '1.0.0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [path.join(__dirname, 'cli.js')],
      env: { ...(process.env as Record<string, string>), DEMO_BREAK: '1' },
    }),
  );
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const r = (await client.callTool({ name, arguments: args })) as unknown as Reply;
    const body = r.content[0].text;
    console.log(`\n> ${name} ${JSON.stringify(args)}`);
    console.log(full ? body : body.split('\n')[0]);
    return r;
  };
  const checks: [string, boolean][] = [];

  const names = (await client.listTools()).tools.map((t) => t.name);
  console.log('Tools:', names.join(', '));
  checks.push(['6 tools', ['list_failed_tests', 'show_trace', 'list_tests', 'rerun_failed', 'rerun_by_id', 'run_tests'].every((n) => names.includes(n))]);

  const listed = await call('list_tests', { project: 'example' });
  checks.push(['list_tests finds 3 example tests', listed.structuredContent?.total === 3 && listed.structuredContent?.withIds === 3]);

  const run = await call('run_tests', { project: 'example' });
  checks.push(['run_tests: 2 pass, 1 fails', run.structuredContent?.counts?.passed === 2 && run.structuredContent?.counts?.failed === 1]);

  const failed = await call('list_failed_tests');
  checks.push(['list_failed_tests shows TC-3', failed.content[0].text.includes('TC-3')]);

  const trace = await call('show_trace', { test: 'TC-3' });
  checks.push(['show_trace finds the step and a trace', trace.structuredContent?.found === true && !!trace.structuredContent?.trace && trace.content[0].text.includes('apply code SAVE10')]);

  const rerun = await call('rerun_by_id', { ids: ['TC-1'] });
  checks.push(['rerun_by_id TC-1 passes', rerun.structuredContent?.counts?.passed === 1]);

  await client.close();
  console.log('');
  for (const [name, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (checks.some(([, ok]) => !ok)) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
