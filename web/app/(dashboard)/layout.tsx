import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart2,
  Search,
  Tag,
  Package,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { DateRangePicker } from "@/components/date-range-picker";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { CredentialCheck } from "@/components/credential-check";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: BarChart2 },
  { href: "/keywords", label: "Keywords", icon: Tag },
  { href: "/search-terms", label: "Search Terms", icon: Search },
  { href: "/products", label: "Products", icon: Package },
  { href: "/setup", label: "Setup", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = !!(
    process.env.AMAZON_REFRESH_TOKEN &&
    process.env.AMAZON_CLIENT_ID &&
    process.env.AMAZON_CLIENT_SECRET &&
    process.env.AMAZON_PROFILE_ID
  );

  if (!configured) redirect("/setup");

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="p-4">
          <SidebarMenu>
            {navItems.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  tooltip={label}
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger />
          <div className="flex-1" />
          <Suspense fallback={null}>
            <DateRangePicker />
          </Suspense>
          <ThemeSwitcher />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <CredentialCheck />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
