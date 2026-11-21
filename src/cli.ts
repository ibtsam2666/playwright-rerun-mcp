#!/usr/bin/env node
/**
 * Starts the playwright-rerun MCP server over stdio. Run it from your Playwright project root,
 * or set PLAYWRIGHT_PROJECT_ROOT.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './tools';

createServer()
  .connect(new StdioServerTransport())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
