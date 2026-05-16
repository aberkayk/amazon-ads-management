import { NextRequest } from 'next/server';
import { handleReportRoute } from '@/lib/route-helper';
import { fetchAdGroups } from '@/lib/amazon-ads';

export async function GET(req: NextRequest) {
  return handleReportRoute(req, 'ad-groups', fetchAdGroups);
}
