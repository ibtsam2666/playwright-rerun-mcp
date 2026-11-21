import { test, expect } from '@playwright/test';

const total = (prices: number[], taxRate: number) => Math.round(prices.reduce((a, b) => a + b, 0) * (1 + taxRate) * 100) / 100;

// DEMO_BREAK=1 makes the discount test fail on purpose, so the smoke test and the README demo
// can show a real failure being listed, explained and rerun.
const discount = (amount: number) => (process.env.DEMO_BREAK === '1' ? amount * 0.95 : amount * 0.9);

test('cart total adds tax', { tag: ['@smoke', '@TC-1'] }, () => {
  expect(total([29.99, 7.99], 0.08)).toBe(41.02);
});

test('empty cart totals zero', { tag: '@TC-2' }, () => {
  expect(total([], 0.08)).toBe(0);
});

test('discount code takes 10% off', { tag: '@TC-3' }, async () => {
  await test.step('apply code SAVE10 to a 50.00 cart', async () => {
    expect(discount(50)).toBe(45);
  });
});
