import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  projects: [
    { name: 'unit', testDir: './tests' },
    // A tiny example suite the smoke test reruns by case ID.
    { name: 'example', testDir: './examples' },
  ],
});
