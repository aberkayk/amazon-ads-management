import { getAccessToken } from '@/lib/amazon-ads';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await getAccessToken();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 401 },
    );
  }
}
