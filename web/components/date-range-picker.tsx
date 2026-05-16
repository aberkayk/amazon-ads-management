'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const defaultEnd = format(new Date(), 'yyyy-MM-dd');

  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(searchParams.get('start') ?? defaultStart),
    to: new Date(searchParams.get('end') ?? defaultEnd),
  });

  useEffect(() => {
    if (range?.from && range?.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('start', format(range.from, 'yyyy-MM-dd'));
      params.set('end', format(range.to, 'yyyy-MM-dd'));
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [range]);

  const label =
    range?.from && range?.to
      ? `${format(range.from, 'MMM d, yyyy')} – ${format(range.to, 'MMM d, yyyy')}`
      : 'Pick a date range';

  return (
    <Popover>
      <PopoverTrigger className={buttonVariants({ variant: 'outline' }) + ' gap-2 text-muted-foreground'}>
        <CalendarIcon className="h-4 w-4" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={2}
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
