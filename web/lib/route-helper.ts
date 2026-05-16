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
