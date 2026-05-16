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
