'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface RefreshButtonProps {
  report: string;
  updatedAt?: string;
  start?: string;
  end?: string;
}

export function RefreshButton({ report, updatedAt, start, end }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ force: 'true' });
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const res = await fetch(`/api/refresh/${report}?${params}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Refresh failed');
      }
      toast.success('Data refreshed successfully');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {updatedAt && (
        <span>Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}</span>
      )}
      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
        <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}
