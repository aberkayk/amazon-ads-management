# Amazon Ads Dashboard — Design Spec

**Date:** 2026-05-16
**Phase:** Faz 1 (read-only monitoring & reporting)

---

## Overview

A browser-based Next.js dashboard that displays Amazon Sponsored Products performance data. The Python `ads_server.py` MCP server is untouched; the Next.js app talks to the Amazon Ads API directly via its own API routes.

---

## Architecture

### Project Structure

```
amazon-claude-mcp/
├── ads_server.py          # untouched — MCP server for Claude Code
├── web/                   # new Next.js app
│   ├── app/
│   │   ├── api/
│   │   │   ├── campaigns/route.ts
│   │   │   ├── ad-groups/route.ts
│   │   │   ├── keywords/route.ts
│   │   │   ├── search-terms/route.ts
│   │   │   ├── products/route.ts
│   │   │   └── refresh/[report]/route.ts
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # sidebar + date range context
│   │   │   ├── page.tsx            # Overview
│   │   │   ├── campaigns/page.tsx
│   │   │   ├── keywords/page.tsx
│   │   │   ├── search-terms/page.tsx
│   │   │   └── products/page.tsx
│   │   ├── layout.tsx              # root layout, fonts
│   │   └── globals.css             # CSS variables — single source of truth for all colors
│   ├── lib/
│   │   ├── amazon-ads.ts           # refresh token + all Amazon Ads API calls
│   │   └── cache.ts                # file-based JSON cache with TTL + force-refresh
│   ├── components/
│   │   ├── ui/                     # shadcn components (auto-generated)
│   │   ├── data-table.tsx          # reusable sortable/filterable table
│   │   ├── metric-card.tsx         # KPI summary card
│   │   ├── refresh-button.tsx      # last-updated timestamp + refresh trigger
│   │   └── date-range-picker.tsx   # shadcn Popover + Calendar
│   └── .env.local                  # AMAZON_* credentials copied from root .env
```

### Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI components:** shadcn/ui
- **Styling:** Tailwind CSS — zero hardcoded colors; all color values come from CSS variables defined in `globals.css`
- **Charts:** Recharts (via shadcn chart primitives)
- **HTTP:** native `fetch` inside API routes

---

## Data Layer

### `lib/amazon-ads.ts`

Single module responsible for:

1. `getAccessToken()` — exchanges refresh token for a short-lived access token
2. One function per report type mirroring `ads_server.py`: `fetchCampaigns`, `fetchAdGroups`, `fetchKeywords`, `fetchSearchTerms`, `fetchProducts`
3. Each report function creates an async Amazon Ads report, polls until `COMPLETED`, downloads + decompresses the GZIP JSON, and computes derived metrics (ROAS, ACoS %, CTR %, CPC)

### `lib/cache.ts`

File-based cache stored at `web/cache/<report>.json`. Each file contains:

```json
{ "updatedAt": "ISO timestamp", "data": [...] }
```

- Cache is considered fresh if `updatedAt` is less than **1 hour** ago
- API routes read the cache first; only call Amazon if stale
- `GET /api/refresh/[report]?force=true` bypasses TTL and fetches fresh data
- Cache directory is git-ignored

### API Routes

Each route (`/api/campaigns`, `/api/keywords`, etc.) accepts an optional `?start=YYYY-MM-DD&end=YYYY-MM-DD` query param (default: last 30 days). Returns JSON. On error returns `{ error: string }` with appropriate HTTP status.

---

## Pages

### Overview (`/`)

- 4 `MetricCard` components: Total Spend, Average ROAS, Total Orders, Total Clicks — aggregated from campaigns report
- Bar chart: top 10 campaigns by ROAS
- Line chart: spend trend (if daily granularity added in future; stubbed for now)

### Campaigns (`/campaigns`)

`DataTable` columns: Campaign Name, Status, Daily Budget, Spend, Revenue, ROAS, ACoS %, Clicks, CTR %, Orders. Sortable by any column. Click row → navigates to `/keywords?campaign=<id>` for drill-down.

### Keywords (`/keywords`)

`DataTable` columns: Campaign, Ad Group, Keyword, Match Type, Bid, Spend, ROAS, ACoS %, CTR %, CPC. Filterable by campaign (dropdown from URL param or selector).

### Search Terms (`/search-terms`)

`DataTable` columns: Search Term, Matched Keyword, Match Type, Campaign, Spend, Clicks, Orders, ROAS.

### Products (`/products`)

`DataTable` columns: ASIN, SKU, Campaign, Ad Group, Spend, Revenue, Orders, ROAS, Other-SKU Revenue.

---

## Shared UI Patterns

### Color Constraint

**No hardcoded color values anywhere in the codebase.** All colors reference CSS custom properties defined in `globals.css` (e.g., `hsl(var(--primary))`, `hsl(var(--muted-foreground))`). shadcn components already follow this pattern. Custom components must do the same. Recharts colors are mapped from CSS variables via `getComputedStyle`.

### Date Range

A `DateRangePicker` in the sidebar/header applies globally. State lives in a React context (`DateRangeContext`) wrapping the dashboard layout. All API calls read from this context.

### Refresh Pattern

Every page shows: `"Last updated: X minutes ago"` + a Refresh button (shadcn `Button` with a spinner icon). Clicking calls `GET /api/refresh/[report]?force=true`, then re-fetches the page data. A `sonner` toast confirms completion or shows an error.

### DataTable

Single reusable `DataTable` component (shadcn table + TanStack Table). Supports: column sorting, column visibility toggle, optional text filter input. Numeric columns right-aligned. Negative/zero ROAS highlighted via `text-destructive` CSS variable.

---

## Faz 2 (out of scope for now)

- Edit campaign budget inline
- Edit keyword bid inline
- Pause / enable campaigns
- These will reuse the same `lib/amazon-ads.ts` module with new PUT/POST functions

---

## Constraints & Decisions

| Decision                  | Rationale                                                              |
| ------------------------- | ---------------------------------------------------------------------- |
| `ads_server.py` untouched | MCP and web are independent consumers of the same API                  |
| File-based cache          | No extra infrastructure; survives process restarts; simple to inspect  |
| 1-hour TTL                | Amazon report generation is slow (~20s); caching avoids repeated waits |
| shadcn components only    | Consistent design system; CSS variable–based colors                    |
| No hardcoded colors       | Single `globals.css` source of truth makes theming trivial later       |
