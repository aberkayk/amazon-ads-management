import Link from 'next/link';
import { Suspense } from 'react';
import { BarChart2, Search, Tag, Package, LayoutDashboard } from 'lucide-react';
import { DateRangePicker } from '@/components/date-range-picker';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: BarChart2 },
  { href: '/keywords', label: 'Keywords', icon: Tag },
  { href: '/search-terms', label: 'Search Terms', icon: Search },
  { href: '/products', label: 'Products', icon: Package },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center px-4">
          <span className="font-semibold text-foreground">Amazon Ads</span>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-end border-b border-border bg-card px-4">
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
