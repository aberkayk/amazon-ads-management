import { readCache, isFresh } from '@/lib/cache';
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
  const entry = readCache<Campaign[]>(cacheKey);
  const campaigns = (entry && isFresh(entry)) ? entry.data : [];

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
        <RefreshButton report="campaigns" updatedAt={entry?.updatedAt} start={start} end={end} />
      </div>
      {campaigns.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No data — click Refresh to load.
        </p>
      )}
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
