'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Campaign } from '@/lib/types';

interface CampaignsBarChartProps {
  campaigns: Campaign[];
}

export function CampaignsBarChart({ campaigns }: CampaignsBarChartProps) {
  const [chartColor, setChartColor] = useState('oklch(0.546 0.245 262)');

  useEffect(() => {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue('--chart-1')
      .trim();
    if (val) setChartColor(val);
  }, []);

  const data = campaigns
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 10)
    .map(c => ({ name: c.campaignName, roas: c.roas, spend: c.cost }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Top 10 Campaigns by ROAS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={v => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
            />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                fontSize: 12,
              }}
            />
            <Bar dataKey="roas" name="ROAS" fill={chartColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
