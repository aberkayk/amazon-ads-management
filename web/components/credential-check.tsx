'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function CredentialCheck() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/health')
      .then(r => { if (!r.ok) router.replace('/setup'); })
      .catch(() => router.replace('/setup'));
  }, [router]);

  return null;
}
