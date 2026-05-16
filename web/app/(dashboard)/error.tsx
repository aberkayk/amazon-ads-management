'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
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
  const router = useRouter();
  const isCred = isCredentialError(error);

  useEffect(() => {
    console.error(error);
    if (isCred) {
      router.replace('/setup');
    }
  }, [error, isCred, router]);

  if (isCred) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Redirecting to setup...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Failed to load data</h2>
        <p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
      </div>
      <Button onClick={unstable_retry}>Try Again</Button>
    </div>
  );
}
