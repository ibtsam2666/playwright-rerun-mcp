import { test, expect } from '@playwright/test';

const total = (prices: number[], taxRate: number) => Math.round(prices.reduce((a, b) => a + b, 0) * (1 + taxRate) * 100) / 100;

test('cart total adds tax', { tag: ['@smoke', '@TC-1'] }, () => {
  expect(total([29.99, 7.99], 0.08)).toBe(41.02);
});

test('empty cart totals zero', { tag: '@TC-2' }, () => {
  expect(total([], 0.08)).toBe(0);
});
