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
