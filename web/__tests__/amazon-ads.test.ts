import { enrichRow } from '../lib/amazon-ads';

test('enrichRow computes roas correctly', () => {
  const row = { cost: 10, sales7d: 50, clicks: 5, impressions: 1000 };
  const enriched = enrichRow(row);
  expect(enriched.roas).toBe(5);
});

test('enrichRow sets roas to 0 when cost is 0', () => {
  const row = { cost: 0, sales7d: 50, clicks: 0, impressions: 0 };
  const enriched = enrichRow(row);
  expect(enriched.roas).toBe(0);
});

test('enrichRow computes acos_pct correctly', () => {
  const row = { cost: 10, sales7d: 50, clicks: 5, impressions: 1000 };
  const enriched = enrichRow(row);
  expect(enriched.acos_pct).toBe(20);
});

test('enrichRow sets acos_pct to null when sales is 0', () => {
  const row = { cost: 10, sales7d: 0, clicks: 5, impressions: 1000 };
  const enriched = enrichRow(row);
  expect(enriched.acos_pct).toBeNull();
});

test('enrichRow computes ctr_pct correctly', () => {
  const row = { cost: 10, sales7d: 50, clicks: 5, impressions: 1000 };
  const enriched = enrichRow(row);
  expect(enriched.ctr_pct).toBe(0.5);
});

test('enrichRow computes cpc correctly', () => {
  const row = { cost: 10, sales7d: 50, clicks: 5, impressions: 1000 };
  const enriched = enrichRow(row);
  expect(enriched.cpc).toBe(2);
});
