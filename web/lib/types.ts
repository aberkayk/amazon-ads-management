export interface CacheEntry<T> {
  updatedAt: string;
  data: T;
}

export interface Campaign {
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  campaignBudget: number;
  campaignBudgetType: string;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export interface AdGroup {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export interface Keyword {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  keywordId: string;
  keyword: string;
  keywordText: string;
  matchType: string;
  keywordBid: number;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export interface SearchTerm {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  keyword: string;
  keywordText: string;
  matchType: string;
  searchTerm: string;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export interface Product {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  advertisedAsin: string;
  advertisedSku: string;
  impressions: number;
  clicks: number;
  cost: number;
  purchases7d: number;
  sales7d: number;
  unitsSoldClicks7d: number;
  salesOtherSku7d: number;
  purchasesOtherSku7d: number;
  roas: number;
  acos_pct: number | null;
  ctr_pct: number;
  cpc: number;
}

export type ReportType = 'campaigns' | 'ad-groups' | 'keywords' | 'search-terms' | 'products';
