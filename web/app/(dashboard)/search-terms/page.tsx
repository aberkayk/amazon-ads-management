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
        <RefreshButton report="search-terms" updatedAt={entry.updatedAt} start={start} end={end} />
      </div>
      <DataTable columns={columns} data={entry.data} filterPlaceholder="Filter search terms..." />
    </div>
  );
}
