import { NextRequest } from 'next/server';
import { handleReportRoute } from '@/lib/route-helper';
import { fetchProducts } from '@/lib/amazon-ads';

export async function GET(req: NextRequest) {
  return handleReportRoute(req, 'products', fetchProducts);
}
