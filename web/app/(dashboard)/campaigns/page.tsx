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
      <DataTable columns={columns} data={entry.data} filterPlaceholder="Filter campaigns..." />
    </div>
  );
}
