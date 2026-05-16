# Amazon Ads Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 16 browser dashboard that displays Amazon Ads performance data with file-based caching and a manual refresh button.

**Architecture:** Next.js 16 App Router with server components fetching data and passing it to client DataTable/chart components. API routes handle Amazon Ads API calls with a 1-hour file-based JSON cache. Date range is stored in URL search params so server components can read it directly.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS (CSS variables only), shadcn/ui, TanStack Table v8, Recharts, date-fns, Sonner, Jest + ts-jest

---

## File Map

```
web/
├── app/
│   ├── api/
│   │   ├── campaigns/route.ts          — GET campaigns data (cache-aware)
│   │   ├── ad-groups/route.ts          — GET ad-groups data (cache-aware)
│   │   ├── keywords/route.ts           — GET keywords data (cache-aware)
│   │   ├── search-terms/route.ts       — GET search-terms data (cache-aware)
│   │   ├── products/route.ts           — GET products data (cache-aware)
│   │   └── refresh/[report]/route.ts   — GET force-refresh any report
│   ├── (dashboard)/
│   │   ├── layout.tsx                  — sidebar nav + date range picker header
│   │   ├── page.tsx                    — Overview: KPI cards + bar chart
│   │   ├── campaigns/page.tsx
│   │   ├── keywords/page.tsx
│   │   ├── search-terms/page.tsx
│   │   └── products/page.tsx
│   ├── layout.tsx                      — root layout (fonts, Toaster)
│   └── globals.css                     — CSS variables, no hardcoded colors
├── lib/
│   ├── types.ts                        — shared TypeScript interfaces
│   ├── cache.ts                        — read/write/TTL file-based JSON cache
│   └── amazon-ads.ts                   — Amazon Ads API client (token + reports)
├── components/
│   ├── ui/                             — shadcn (auto-generated, do not edit)
│   ├── data-table.tsx                  — TanStack Table wrapper (sort, filter, col-visibility)
│   ├── metric-card.tsx                 — single KPI card
│   ├── refresh-button.tsx              — "Updated X ago" + Refresh button
│   ├── campaigns-bar-chart.tsx         — Recharts bar chart (Recharts is client-only)
│   └── date-range-picker.tsx           — shadcn Popover+Calendar, writes to URL params
├── __tests__/
│   ├── cache.test.ts
│   └── amazon-ads.test.ts
├── cache/                              — gitignored, JSON cache files at runtime
├── .env.local
├── jest.config.ts
└── jest.setup.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `web/` (entire Next.js project)
- Create: `web/.env.local`
- Create: `web/cache/` (gitignored directory)

- [ ] **Step 1: Scaffold Next.js 16 project**

```bash
cd /Users/ahmet.kocak/Projects/amazon-claude-mcp
npx create-next-app@16 web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-eslint
```

When prompted interactively, confirm App Router, TypeScript, and Tailwind.

- [ ] **Step 2: Install additional dependencies**

```bash
cd web
npm install @tanstack/react-table recharts date-fns sonner lucide-react
npm install --save-dev jest ts-jest @types/jest jest-environment-node
```

- [ ] **Step 3: Initialize shadcn**

```bash
npx shadcn@latest init
```

Choose: Default style, CSS variables for colors, default base color.

- [ ] **Step 4: Add shadcn components**

```bash
npx shadcn@latest add button card table input dropdown-menu popover calendar badge separator sonner select sheet
```

- [ ] **Step 5: Create .env.local**

Copy credentials from the root `.env` file:

```bash
# web/.env.local
AMAZON_CLIENT_ID=<value from ../.env>
AMAZON_CLIENT_SECRET=<value from ../.env>
AMAZON_REFRESH_TOKEN=<value from ../.env>
AMAZON_PROFILE_ID=<value from ../.env>
```

- [ ] **Step 6: Create cache directory and add to .gitignore**

```bash
mkdir -p cache
echo "cache/" >> .gitignore
```

- [ ] **Step 7: Configure Jest**

Create `web/jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
};

export default config;
```

Create `web/jest.setup.ts`:

```typescript
// placeholder for future setup
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: `ready on http://localhost:3000` with no errors. Open browser to confirm default Next.js page loads.

- [ ] **Step 9: Commit**

```bash
git add web/
git commit -m "feat: scaffold Next.js 16 dashboard project with shadcn + dependencies"
```

---

## Task 2: globals.css CSS Variables

**Files:**
- Modify: `web/app/globals.css`

- [ ] **Step 1: Replace globals.css**

shadcn init already writes the CSS variables. Verify `web/app/globals.css` contains `:root` and `.dark` blocks with variables like `--background`, `--foreground`, `--primary`, `--muted`, `--destructive`, `--border`, `--card`, etc.

Add chart-specific variables at the end of the `:root` block:

```css
/* Add inside :root { } after existing variables */
--chart-1: 221 83% 53%;
--chart-2: 142 71% 45%;
--chart-3: 346 77% 50%;
--chart-4: 28 89% 52%;
--chart-5: 198 93% 44%;
```

And in `.dark { }`:

```css
--chart-1: 217 91% 60%;
--chart-2: 142 71% 55%;
--chart-3: 346 77% 60%;
--chart-4: 28 89% 62%;
--chart-5: 198 93% 54%;
```

- [ ] **Step 2: Confirm no hardcoded colors in globals.css**

The file must contain only `hsl(var(--...))` references and the raw `H S% L%` variable definitions. No `#hex`, `rgb()`, or named colors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add chart CSS variables to globals.css"
```

---

## Task 3: Shared TypeScript Types

**Files:**
- Create: `web/lib/types.ts`

- [ ] **Step 1: Create types.ts**

```typescript
// web/lib/types.ts

export interface CacheEntry<T> {
  updatedAt: string; // ISO 8601
  data: T;
}

export interface Campaign {
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  campaignBudget: number;
  campaignBudgetType: string;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export interface AdGroup {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export interface Keyword {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  keywordId: string;
  keyword: string;
  keywordText: string;
  matchType: string;
  keywordBid: number;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export interface SearchTerm {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  keyword: string;
  keywordText: string;
  matchType: string;
  searchTerm: string;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export interface Product {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  advertisedAsin: string;
  advertisedSku: string;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  salesOtherSku7d: number;
  purchasesOtherSku7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export type ReportType = 'campaigns' | 'ad-groups' | 'keywords' | 'search-terms' | 'products';
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 4: lib/cache.ts

**Files:**
- Create: `web/lib/cache.ts`
- Create: `web/__tests__/cache.test.ts`

- [ ] **Step 1: Write failing tests**

Create `web/__tests__/cache.test.ts`:

```typescript
import fs from 'fs';
import path from 'path';

// Override CACHE_DIR before importing cache module
const TEST_CACHE_DIR = path.join(__dirname, 'tmp-cache');
jest.mock('path', () => {
  const real = jest.requireActual('path');
  return {
    ...real,
    join: (...args: string[]) => {
      // Redirect cache dir to test dir
      const result = real.join(...args);
      if (args.includes('cache')) {
        return result.replace(
          real.join(process.cwd(), 'cache'),
          TEST_CACHE_DIR,
        );
      }
      return result;
    },
  };
});

import { readCache, writeCache, isFresh } from '@/lib/cache';

afterEach(() => {
  if (fs.existsSync(TEST_CACHE_DIR)) {
    fs.rmSync(TEST_CACHE_DIR, { recursive: true });
  }
});

test('readCache returns null when file does not exist', () => {
  expect(readCache('nonexistent')).toBeNull();
});

test('writeCache creates a file and readCache reads it back', () => {
  const data = [{ id: 1, name: 'test' }];
  writeCache('test-key', data);
  const entry = readCache<typeof data>('test-key');
  expect(entry).not.toBeNull();
  expect(entry!.data).toEqual(data);
  expect(entry!.updatedAt).toBeTruthy();
});

test('isFresh returns true for a just-written cache entry', () => {
  const entry = writeCache('fresh-key', { value: 42 });
  expect(isFresh(entry)).toBe(true);
});

test('isFresh returns false for an entry older than 1 hour', () => {
  const entry = {
    updatedAt: new Date(Date.now() - 61 * 60 * 1000).toISOString(),
    data: {},
  };
  expect(isFresh(entry)).toBe(false);
});

test('readCache returns null when JSON is corrupt', () => {
  fs.mkdirSync(TEST_CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(TEST_CACHE_DIR, 'bad-key.json'), 'not json');
  expect(readCache('bad-key')).toBeNull();
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest __tests__/cache.test.ts --no-coverage
```

Expected: FAIL — `readCache` is not defined.

- [ ] **Step 3: Implement lib/cache.ts**

```typescript
// web/lib/cache.ts
import fs from 'fs';
import path from 'path';
import type { CacheEntry } from './types';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const TTL_MS = 60 * 60 * 1000; // 1 hour

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function cachePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

export function readCache<T>(key: string): CacheEntry<T> | null {
  ensureCacheDir();
  const file = cachePath(key);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as CacheEntry<T>;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): CacheEntry<T> {
  ensureCacheDir();
  const entry: CacheEntry<T> = { updatedAt: new Date().toISOString(), data };
  fs.writeFileSync(cachePath(key), JSON.stringify(entry));
  return entry;
}

export function isFresh(entry: CacheEntry<unknown>): boolean {
  return Date.now() - new Date(entry.updatedAt).getTime() < TTL_MS;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest __tests__/cache.test.ts --no-coverage
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/cache.ts __tests__/cache.test.ts
git commit -m "feat: add file-based cache with TTL"
```

---

## Task 5: lib/amazon-ads.ts

**Files:**
- Create: `web/lib/amazon-ads.ts`
- Create: `web/__tests__/amazon-ads.test.ts`

- [ ] **Step 1: Write failing tests**

Create `web/__tests__/amazon-ads.test.ts`:

```typescript
import { enrichRow } from '@/lib/amazon-ads';

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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest __tests__/amazon-ads.test.ts --no-coverage
```

Expected: FAIL — `enrichRow` is not defined.

- [ ] **Step 3: Implement lib/amazon-ads.ts**

```typescript
// web/lib/amazon-ads.ts
import zlib from 'zlib';
import { promisify } from 'util';
import type { Campaign, AdGroup, Keyword, SearchTerm, Product } from './types';

const gunzip = promisify(zlib.gunzip);

const ADS_API = 'https://advertising-api.amazon.com';

function env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export async function getAccessToken(): Promise<string> {
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env('AMAZON_REFRESH_TOKEN'),
      client_id: env('AMAZON_CLIENT_ID'),
      client_secret: env('AMAZON_CLIENT_SECRET'),
    }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

function adsHeaders(token: string): Record<string, string> {
  return {
    'Amazon-Advertising-API-ClientId': env('AMAZON_CLIENT_ID'),
    'Authorization': `Bearer ${token}`,
    'Amazon-Advertising-API-Scope': env('AMAZON_PROFILE_ID'),
    'Content-Type': 'application/json',
  };
}

export function enrichRow<T extends Record<string, unknown>>(row: T): T & {
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
} {
  const cost = Number(row.cost ?? 0);
  const sales = Number(row.sales7d ?? 0);
  const clicks = Number(row.clicks ?? 0);
  const impressions = Number(row.impressions ?? 0);
  return {
    ...row,
    roas: cost > 0 ? Math.round((sales / cost) * 100) / 100 : 0,
    acos_pct: sales > 0 ? Math.round((cost / sales) * 10000) / 100 : null,
    ctr_pct: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
    cpc: clicks > 0 ? Math.round((cost / clicks) * 100) / 100 : 0,
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runReport(
  reportTypeId: string,
  groupBy: string[],
  columns: string[],
  startDate: string,
  endDate: string,
  timeoutMs = 300_000,
): Promise<Record<string, unknown>[]> {
  const token = await getAccessToken();
  const headers = adsHeaders(token);

  const createRes = await fetch(`${ADS_API}/reporting/reports`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: `${reportTypeId}_${startDate}_${endDate}`,
      startDate,
      endDate,
      configuration: {
        adProduct: 'SPONSORED_PRODUCTS',
        groupBy,
        columns,
        reportTypeId,
        timeUnit: 'SUMMARY',
        format: 'GZIP_JSON',
      },
    }),
    cache: 'no-store',
  });

  if (!createRes.ok) {
    throw new Error(`Report creation failed: ${createRes.status} ${await createRes.text()}`);
  }

  const { reportId } = await createRes.json();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await sleep(10_000);
    const statusRes = await fetch(`${ADS_API}/reporting/reports/${reportId}`, {
      headers,
      cache: 'no-store',
    });
    const body = await statusRes.json();

    if (body.status === 'COMPLETED') {
      const dlRes = await fetch(body.url);
      const buffer = Buffer.from(await dlRes.arrayBuffer());
      const decompressed = await gunzip(buffer);
      return JSON.parse(decompressed.toString('utf-8'));
    }

    if (body.status === 'FAILED') {
      throw new Error(`Report failed: ${JSON.stringify(body)}`);
    }
  }

  throw new Error(`Report timed out after ${timeoutMs / 1000}s (reportId=${reportId})`);
}

function defaultDates(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export async function fetchCampaigns(startDate?: string, endDate?: string): Promise<Campaign[]> {
  const d = startDate && endDate ? { startDate, endDate } : defaultDates();
  const rows = await runReport(
    'spCampaigns', ['campaign'],
    ['campaignId','campaignName','campaignStatus','campaignBudget','campaignBudgetType',
     'impressions','clicks','cost','purchases7d','sales7d','unitsSoldClicks7d'],
    d.startDate, d.endDate,
  );
  return rows.map(enrichRow) as Campaign[];
}

export async function fetchAdGroups(startDate?: string, endDate?: string): Promise<AdGroup[]> {
  const d = startDate && endDate ? { startDate, endDate } : defaultDates();
  const rows = await runReport(
    'spAdGroups', ['adGroup'],
    ['campaignId','campaignName','adGroupId','adGroupName',
     'impressions','clicks','cost','purchases7d','sales7d','unitsSoldClicks7d'],
    d.startDate, d.endDate,
  );
  return rows.map(enrichRow) as AdGroup[];
}

export async function fetchKeywords(startDate?: string, endDate?: string): Promise<Keyword[]> {
  const d = startDate && endDate ? { startDate, endDate } : defaultDates();
  const rows = await runReport(
    'spKeywords', ['keyword'],
    ['campaignId','campaignName','adGroupId','adGroupName','keywordId','keyword',
     'keywordText','matchType','keywordBid','impressions','clicks','cost',
     'purchases7d','sales7d','unitsSoldClicks7d'],
    d.startDate, d.endDate,
  );
  return rows.map(enrichRow) as Keyword[];
}

export async function fetchSearchTerms(startDate?: string, endDate?: string): Promise<SearchTerm[]> {
  const d = startDate && endDate ? { startDate, endDate } : defaultDates();
  const rows = await runReport(
    'spSearchTerm', ['searchTerm'],
    ['campaignId','campaignName','adGroupId','adGroupName','keyword','keywordText',
     'matchType','searchTerm','impressions','clicks','cost','purchases7d','sales7d','unitsSoldClicks7d'],
    d.startDate, d.endDate,
  );
  return rows.map(enrichRow) as SearchTerm[];
}

export async function fetchProducts(startDate?: string, endDate?: string): Promise<Product[]> {
  const d = startDate && endDate ? { startDate, endDate } : defaultDates();
  const rows = await runReport(
    'spAdvertisedProduct', ['advertiser'],
    ['campaignId','campaignName','adGroupId','adGroupName','advertisedAsin','advertisedSku',
     'impressions','clicks','cost','purchases7d','sales7d','unitsSoldClicks7d',
     'salesOtherSku7d','purchasesOtherSku7d'],
    d.startDate, d.endDate,
  );
  return rows.map(enrichRow) as Product[];
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest __tests__/amazon-ads.test.ts --no-coverage
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/amazon-ads.ts __tests__/amazon-ads.test.ts
git commit -m "feat: add Amazon Ads API client with enrichRow helper"
```

---

## Task 6: API Routes

**Files:**
- Create: `web/app/api/campaigns/route.ts`
- Create: `web/app/api/ad-groups/route.ts`
- Create: `web/app/api/keywords/route.ts`
- Create: `web/app/api/search-terms/route.ts`
- Create: `web/app/api/products/route.ts`
- Create: `web/app/api/refresh/[report]/route.ts`

All routes share the same pattern: read cache → return if fresh → else fetch → write cache → return.

- [ ] **Step 1: Create a shared route helper**

Create `web/lib/route-helper.ts`:

```typescript
// web/lib/route-helper.ts
import { NextRequest, NextResponse } from 'next/server';
import { readCache, writeCache, isFresh } from './cache';
import type { CacheEntry } from './types';

type Fetcher<T> = (start?: string, end?: string) => Promise<T>;

export async function handleReportRoute<T>(
  req: NextRequest,
  cachePrefix: string,
  fetcher: Fetcher<T>,
): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start') ?? undefined;
  const end = searchParams.get('end') ?? undefined;
  const cacheKey = `${cachePrefix}_${start ?? 'default'}_${end ?? 'default'}`;

  const cached = readCache<T>(cacheKey);
  if (cached && isFresh(cached)) {
    return NextResponse.json({ updatedAt: cached.updatedAt, data: cached.data });
  }

  try {
    const data = await fetcher(start, end);
    const entry: CacheEntry<T> = writeCache(cacheKey, data);
    return NextResponse.json({ updatedAt: entry.updatedAt, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create campaign, ad-groups, keywords, search-terms, products routes**

`web/app/api/campaigns/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { handleReportRoute } from '@/lib/route-helper';
import { fetchCampaigns } from '@/lib/amazon-ads';

export async function GET(req: NextRequest) {
  return handleReportRoute(req, 'campaigns', fetchCampaigns);
}
```

`web/app/api/ad-groups/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { handleReportRoute } from '@/lib/route-helper';
import { fetchAdGroups } from '@/lib/amazon-ads';

export async function GET(req: NextRequest) {
  return handleReportRoute(req, 'ad-groups', fetchAdGroups);
}
```

`web/app/api/keywords/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { handleReportRoute } from '@/lib/route-helper';
import { fetchKeywords } from '@/lib/amazon-ads';

export async function GET(req: NextRequest) {
  return handleReportRoute(req, 'keywords', fetchKeywords);
}
```

`web/app/api/search-terms/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { handleReportRoute } from '@/lib/route-helper';
import { fetchSearchTerms } from '@/lib/amazon-ads';

export async function GET(req: NextRequest) {
  return handleReportRoute(req, 'search-terms', fetchSearchTerms);
}
```

`web/app/api/products/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { handleReportRoute } from '@/lib/route-helper';
import { fetchProducts } from '@/lib/amazon-ads';

export async function GET(req: NextRequest) {
  return handleReportRoute(req, 'products', fetchProducts);
}
```

- [ ] **Step 3: Create refresh route**

`web/app/api/refresh/[report]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { writeCache } from '@/lib/cache';
import {
  fetchCampaigns,
  fetchAdGroups,
  fetchKeywords,
  fetchSearchTerms,
  fetchProducts,
} from '@/lib/amazon-ads';

const fetchers = {
  campaigns: fetchCampaigns,
  'ad-groups': fetchAdGroups,
  keywords: fetchKeywords,
  'search-terms': fetchSearchTerms,
  products: fetchProducts,
} as const;

type ReportKey = keyof typeof fetchers;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ report: string }> },
) {
  const { report } = await params;
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start') ?? undefined;
  const end = searchParams.get('end') ?? undefined;

  if (!(report in fetchers)) {
    return NextResponse.json({ error: `Unknown report: ${report}` }, { status: 400 });
  }

  try {
    const data = await fetchers[report as ReportKey](start, end);
    const cacheKey = `${report}_${start ?? 'default'}_${end ?? 'default'}`;
    const entry = writeCache(cacheKey, data);
    return NextResponse.json({ updatedAt: entry.updatedAt, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/ lib/route-helper.ts
git commit -m "feat: add API routes with cache-aware data fetching"
```

---

## Task 7: DateRangePicker Component

**Files:**
- Create: `web/components/date-range-picker.tsx`

The picker reads from URL search params and pushes updates back to the URL, enabling server components to read the date range from `searchParams`.

- [ ] **Step 1: Create DateRangePicker**

```typescript
// web/components/date-range-picker.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const defaultEnd = format(new Date(), 'yyyy-MM-dd');

  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(searchParams.get('start') ?? defaultStart),
    to: new Date(searchParams.get('end') ?? defaultEnd),
  });

  useEffect(() => {
    if (range?.from && range?.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('start', format(range.from, 'yyyy-MM-dd'));
      params.set('end', format(range.to, 'yyyy-MM-dd'));
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [range]);

  const label =
    range?.from && range?.to
      ? `${format(range.from, 'MMM d, yyyy')} – ${format(range.to, 'MMM d, yyyy')}`
      : 'Pick a date range';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={2}
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/date-range-picker.tsx
git commit -m "feat: add DateRangePicker writing date range to URL params"
```

---

## Task 8: DataTable Component

**Files:**
- Create: `web/components/data-table.tsx`

- [ ] **Step 1: Create DataTable**

```typescript
// web/components/data-table.tsx
'use client';

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronDown, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterPlaceholder?: string;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterPlaceholder = 'Filter...',
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnVisibility, globalFilter },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={filterPlaceholder}
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(col => col.getCanHide())
              .map(col => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={val => col.toggleVisibility(val)}
                  className="capitalize"
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            sorted === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                            )
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {table.getFilteredRowModel().rows.length} row(s)
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/data-table.tsx
git commit -m "feat: add reusable DataTable with sort, filter, column visibility"
```

---

## Task 9: MetricCard, RefreshButton, CampaignsBarChart

**Files:**
- Create: `web/components/metric-card.tsx`
- Create: `web/components/refresh-button.tsx`
- Create: `web/components/campaigns-bar-chart.tsx`

- [ ] **Step 1: Create MetricCard**

```typescript
// web/components/metric-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
}

export function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create RefreshButton**

```typescript
// web/components/refresh-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface RefreshButtonProps {
  report: string;
  updatedAt: string;
  start?: string;
  end?: string;
}

export function RefreshButton({ report, updatedAt, start, end }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ force: 'true' });
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const res = await fetch(`/api/refresh/${report}?${params}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Refresh failed');
      }
      toast.success('Data refreshed successfully');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}</span>
      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
        <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create CampaignsBarChart**

```typescript
// web/components/campaigns-bar-chart.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Campaign } from '@/lib/types';

interface CampaignsBarChartProps {
  campaigns: Campaign[];
}

export function CampaignsBarChart({ campaigns }: CampaignsBarChartProps) {
  const [chartColor, setChartColor] = useState('hsl(221 83% 53%)');

  useEffect(() => {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue('--chart-1')
      .trim();
    if (val) setChartColor(`hsl(${val})`);
  }, []);

  const data = campaigns
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 10)
    .map(c => ({ name: c.campaignName, roas: c.roas, spend: c.cost }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Top 10 Campaigns by ROAS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={v => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
            />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                fontSize: 12,
              }}
            />
            <Bar dataKey="roas" name="ROAS" fill={chartColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/metric-card.tsx components/refresh-button.tsx components/campaigns-bar-chart.tsx
git commit -m "feat: add MetricCard, RefreshButton, and CampaignsBarChart components"
```

---

## Task 10: Root Layout + Dashboard Layout

**Files:**
- Modify: `web/app/layout.tsx`
- Create: `web/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Update root layout**

```typescript
// web/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Amazon Ads Dashboard',
  description: 'Sponsored Products performance dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create dashboard layout with sidebar**

```typescript
// web/app/(dashboard)/layout.tsx
import Link from 'next/link';
import { Suspense } from 'react';
import { BarChart2, Search, Tag, Package, LayoutDashboard } from 'lucide-react';
import { DateRangePicker } from '@/components/date-range-picker';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: BarChart2 },
  { href: '/keywords', label: 'Keywords', icon: Tag },
  { href: '/search-terms', label: 'Search Terms', icon: Search },
  { href: '/products', label: 'Products', icon: Package },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center px-4">
          <span className="font-semibold text-foreground">Amazon Ads</span>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-end border-b border-border bg-card px-4">
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/'(dashboard)'/layout.tsx
git commit -m "feat: add root layout with Toaster and dashboard layout with sidebar"
```

---

## Task 11: Overview Page

**Files:**
- Create: `web/app/(dashboard)/page.tsx`

- [ ] **Step 1: Create Overview page**

```typescript
// web/app/(dashboard)/page.tsx
import { readCache, writeCache, isFresh } from '@/lib/cache';
import { fetchCampaigns } from '@/lib/amazon-ads';
import { MetricCard } from '@/components/metric-card';
import { RefreshButton } from '@/components/refresh-button';
import { CampaignsBarChart } from '@/components/campaigns-bar-chart';
import type { Campaign } from '@/lib/types';

interface Props {
  searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function OverviewPage({ searchParams }: Props) {
  const { start, end } = await searchParams;
  const cacheKey = `campaigns_${start ?? 'default'}_${end ?? 'default'}`;

  let entry = readCache<Campaign[]>(cacheKey);
  if (!entry || !isFresh(entry)) {
    const data = await fetchCampaigns(start, end);
    entry = writeCache(cacheKey, data);
  }

  const campaigns = entry.data;
  const totalSpend = campaigns.reduce((s, c) => s + c.cost, 0);
  const totalOrders = campaigns.reduce((s, c) => s + c.purchases7d, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const avgRoas =
    campaigns.length > 0
      ? campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Overview</h1>
        <RefreshButton report="campaigns" updatedAt={entry.updatedAt} start={start} end={end} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard title="Total Spend" value={`$${totalSpend.toFixed(2)}`} />
        <MetricCard title="Avg ROAS" value={avgRoas.toFixed(2)} />
        <MetricCard title="Total Orders" value={totalOrders.toLocaleString()} />
        <MetricCard title="Total Clicks" value={totalClicks.toLocaleString()} />
      </div>

      <CampaignsBarChart campaigns={campaigns} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/'(dashboard)'/page.tsx
git commit -m "feat: add Overview page with KPI cards and bar chart"
```

---

## Task 12: Campaigns Page

**Files:**
- Create: `web/app/(dashboard)/campaigns/page.tsx`

- [ ] **Step 1: Create Campaigns page**

```typescript
// web/app/(dashboard)/campaigns/page.tsx
import { redirect } from 'next/navigation';
import { readCache, writeCache, isFresh } from '@/lib/cache';
import { fetchCampaigns } from '@/lib/amazon-ads';
import { RefreshButton } from '@/components/refresh-button';
import { DataTable } from '@/components/data-table';
import type { Campaign } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Campaign>[] = [
  { accessorKey: 'campaignName', header: 'Campaign', enableSorting: true },
  { accessorKey: 'campaignStatus', header: 'Status', enableSorting: true },
  {
    accessorKey: 'campaignBudget',
    header: 'Budget',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
  {
    accessorKey: 'cost',
    header: 'Spend',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
  {
    accessorKey: 'sales7d',
    header: 'Revenue',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
  {
    accessorKey: 'roas',
    header: 'ROAS',
    cell: ({ getValue }) => {
      const v = Number(getValue());
      return (
        <span className={v <= 0 ? 'text-destructive' : ''}>
          {v.toFixed(2)}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'acos_pct',
    header: 'ACoS %',
    cell: ({ getValue }) => (getValue() == null ? '—' : `${getValue()}%`),
    enableSorting: true,
  },
  { accessorKey: 'clicks', header: 'Clicks', enableSorting: true },
  {
    accessorKey: 'ctr_pct',
    header: 'CTR %',
    cell: ({ getValue }) => `${getValue()}%`,
    enableSorting: true,
  },
  { accessorKey: 'purchases7d', header: 'Orders', enableSorting: true },
];

interface Props {
  searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function CampaignsPage({ searchParams }: Props) {
  const { start, end } = await searchParams;
  const cacheKey = `campaigns_${start ?? 'default'}_${end ?? 'default'}`;

  let entry = readCache<Campaign[]>(cacheKey);
  if (!entry || !isFresh(entry)) {
    const data = await fetchCampaigns(start, end);
    entry = writeCache(cacheKey, data);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Campaigns</h1>
        <RefreshButton report="campaigns" updatedAt={entry.updatedAt} start={start} end={end} />
      </div>
      <DataTable
        columns={columns}
        data={entry.data}
        filterPlaceholder="Filter campaigns..."
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/'(dashboard)'/campaigns/page.tsx
git commit -m "feat: add Campaigns page with sortable DataTable"
```

---

## Task 13: Keywords Page

**Files:**
- Create: `web/app/(dashboard)/keywords/page.tsx`

- [ ] **Step 1: Create Keywords page**

```typescript
// web/app/(dashboard)/keywords/page.tsx
import { readCache, writeCache, isFresh } from '@/lib/cache';
import { fetchKeywords } from '@/lib/amazon-ads';
import { RefreshButton } from '@/components/refresh-button';
import { DataTable } from '@/components/data-table';
import type { Keyword } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Keyword>[] = [
  { accessorKey: 'campaignName', header: 'Campaign', enableSorting: true },
  { accessorKey: 'adGroupName', header: 'Ad Group', enableSorting: true },
  { accessorKey: 'keywordText', header: 'Keyword', enableSorting: true },
  { accessorKey: 'matchType', header: 'Match Type', enableSorting: true },
  {
    accessorKey: 'keywordBid',
    header: 'Bid',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
  {
    accessorKey: 'cost',
    header: 'Spend',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
  {
    accessorKey: 'roas',
    header: 'ROAS',
    cell: ({ getValue }) => {
      const v = Number(getValue());
      return <span className={v <= 0 ? 'text-destructive' : ''}>{v.toFixed(2)}</span>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'acos_pct',
    header: 'ACoS %',
    cell: ({ getValue }) => (getValue() == null ? '—' : `${getValue()}%`),
    enableSorting: true,
  },
  {
    accessorKey: 'ctr_pct',
    header: 'CTR %',
    cell: ({ getValue }) => `${getValue()}%`,
    enableSorting: true,
  },
  {
    accessorKey: 'cpc',
    header: 'CPC',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
  { accessorKey: 'purchases7d', header: 'Orders', enableSorting: true },
];

interface Props {
  searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function KeywordsPage({ searchParams }: Props) {
  const { start, end } = await searchParams;
  const cacheKey = `keywords_${start ?? 'default'}_${end ?? 'default'}`;

  let entry = readCache<Keyword[]>(cacheKey);
  if (!entry || !isFresh(entry)) {
    const data = await fetchKeywords(start, end);
    entry = writeCache(cacheKey, data);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Keywords</h1>
        <RefreshButton report="keywords" updatedAt={entry.updatedAt} start={start} end={end} />
      </div>
      <DataTable
        columns={columns}
        data={entry.data}
        filterPlaceholder="Filter keywords..."
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/'(dashboard)'/keywords/page.tsx
git commit -m "feat: add Keywords page"
```

---

## Task 14: Search Terms Page

**Files:**
- Create: `web/app/(dashboard)/search-terms/page.tsx`

- [ ] **Step 1: Create Search Terms page**

```typescript
// web/app/(dashboard)/search-terms/page.tsx
import { readCache, writeCache, isFresh } from '@/lib/cache';
import { fetchSearchTerms } from '@/lib/amazon-ads';
import { RefreshButton } from '@/components/refresh-button';
import { DataTable } from '@/components/data-table';
import type { SearchTerm } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<SearchTerm>[] = [
  { accessorKey: 'searchTerm', header: 'Search Term', enableSorting: true },
  { accessorKey: 'keywordText', header: 'Matched Keyword', enableSorting: true },
  { accessorKey: 'matchType', header: 'Match Type', enableSorting: true },
  { accessorKey: 'campaignName', header: 'Campaign', enableSorting: true },
  { accessorKey: 'adGroupName', header: 'Ad Group', enableSorting: true },
  {
    accessorKey: 'cost',
    header: 'Spend',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
  { accessorKey: 'clicks', header: 'Clicks', enableSorting: true },
  { accessorKey: 'purchases7d', header: 'Orders', enableSorting: true },
  {
    accessorKey: 'roas',
    header: 'ROAS',
    cell: ({ getValue }) => {
      const v = Number(getValue());
      return <span className={v <= 0 ? 'text-destructive' : ''}>{v.toFixed(2)}</span>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'acos_pct',
    header: 'ACoS %',
    cell: ({ getValue }) => (getValue() == null ? '—' : `${getValue()}%`),
    enableSorting: true,
  },
];

interface Props {
  searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function SearchTermsPage({ searchParams }: Props) {
  const { start, end } = await searchParams;
  const cacheKey = `search-terms_${start ?? 'default'}_${end ?? 'default'}`;

  let entry = readCache<SearchTerm[]>(cacheKey);
  if (!entry || !isFresh(entry)) {
    const data = await fetchSearchTerms(start, end);
    entry = writeCache(cacheKey, data);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Search Terms</h1>
        <RefreshButton
          report="search-terms"
          updatedAt={entry.updatedAt}
          start={start}
          end={end}
        />
      </div>
      <DataTable
        columns={columns}
        data={entry.data}
        filterPlaceholder="Filter search terms..."
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/'(dashboard)'/search-terms/page.tsx
git commit -m "feat: add Search Terms page"
```

---

## Task 15: Products Page

**Files:**
- Create: `web/app/(dashboard)/products/page.tsx`

- [ ] **Step 1: Create Products page**

```typescript
// web/app/(dashboard)/products/page.tsx
import { readCache, writeCache, isFresh } from '@/lib/cache';
import { fetchProducts } from '@/lib/amazon-ads';
import { RefreshButton } from '@/components/refresh-button';
import { DataTable } from '@/components/data-table';
import type { Product } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'advertisedAsin', header: 'ASIN', enableSorting: true },
  { accessorKey: 'advertisedSku', header: 'SKU', enableSorting: true },
  { accessorKey: 'campaignName', header: 'Campaign', enableSorting: true },
  { accessorKey: 'adGroupName', header: 'Ad Group', enableSorting: true },
  {
    accessorKey: 'cost',
    header: 'Spend',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
  {
    accessorKey: 'sales7d',
    header: 'Revenue',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
  { accessorKey: 'purchases7d', header: 'Orders', enableSorting: true },
  {
    accessorKey: 'roas',
    header: 'ROAS',
    cell: ({ getValue }) => {
      const v = Number(getValue());
      return <span className={v <= 0 ? 'text-destructive' : ''}>{v.toFixed(2)}</span>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'acos_pct',
    header: 'ACoS %',
    cell: ({ getValue }) => (getValue() == null ? '—' : `${getValue()}%`),
    enableSorting: true,
  },
  {
    accessorKey: 'salesOtherSku7d',
    header: 'Other SKU Rev.',
    cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    enableSorting: true,
  },
];

interface Props {
  searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { start, end } = await searchParams;
  const cacheKey = `products_${start ?? 'default'}_${end ?? 'default'}`;

  let entry = readCache<Product[]>(cacheKey);
  if (!entry || !isFresh(entry)) {
    const data = await fetchProducts(start, end);
    entry = writeCache(cacheKey, data);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <RefreshButton report="products" updatedAt={entry.updatedAt} start={start} end={end} />
      </div>
      <DataTable
        columns={columns}
        data={entry.data}
        filterPlaceholder="Filter by ASIN or SKU..."
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/'(dashboard)'/products/page.tsx
git commit -m "feat: add Products page"
```

---

## Task 16: Smoke Test

- [ ] **Step 1: Run all unit tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Start dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- Sidebar navigation renders
- Date range picker appears in header
- Overview page loads (may take 20-30s on first load while Amazon report generates)
- Navigating to /campaigns, /keywords, /search-terms, /products all render tables
- Refresh button triggers a new fetch and shows toast

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Faz 1 Amazon Ads dashboard (monitoring + reporting)"
```
