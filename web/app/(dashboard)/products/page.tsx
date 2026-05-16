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
      <DataTable columns={columns} data={entry.data} filterPlaceholder="Filter by ASIN or SKU..." />
    </div>
  );
}
