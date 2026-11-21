/**
 * End-to-end check: starts the built server over stdio the way an MCP client would, lists its
 * tools, then reruns the example test TC-1 by case ID.  npm run smoke
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';

async function main() {
  const client = new Client({ name: 'smoke-client', version: '1.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(__dirname, 'cli.js')] }));

  const names = (await client.listTools()).tools.map((t) => t.name);
  console.log('Tools:', names.join(', '));

  const res = await client.callTool({ name: 'rerun_by_id', arguments: { ids: ['TC-1'] } });
  console.log((res.content as { text: string }[])[0].text.split('\n')[0]);
  console.log('structured:', JSON.stringify(res.structuredContent));
  await client.close();

  const counts = (res.structuredContent as { counts?: { passed: number } } | undefined)?.counts;
  if (!['list_failed_tests', 'rerun_failed', 'rerun_by_id', 'run_tests'].every((n) => names.includes(n))) process.exit(1);
  if (!counts || counts.passed !== 1) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
