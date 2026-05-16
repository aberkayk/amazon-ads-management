'use client';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function isCredentialError(error: Error) {
  const m = error.message;
  return m.includes('Missing env var') || m.includes('Token error') || m.includes('access_token');
}

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);
  const isCred = isCredentialError(error);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          {isCred ? 'Amazon connection not configured' : 'Failed to load data'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {isCred
            ? 'Amazon Ads API credentials are missing or invalid. Complete the setup guide to continue.'
            : error.message}
        </p>
      </div>
      {isCred ? (
        <Button onClick={() => { window.location.href = '/setup'; }}>
          Go to Setup Guide
        </Button>
      ) : (
        <Button onClick={unstable_retry}>Try Again</Button>
      )}
    </div>
  );
}
