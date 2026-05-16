import os
import time
import gzip
import json
import requests
from pathlib import Path
from datetime import datetime, timedelta
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

mcp = FastMCP("AmazonAds")

CLIENT_ID = os.environ.get("AMAZON_CLIENT_ID")
CLIENT_SECRET = os.environ.get("AMAZON_CLIENT_SECRET")
REFRESH_TOKEN = os.environ.get("AMAZON_REFRESH_TOKEN")
PROFILE_ID = os.environ.get("AMAZON_PROFILE_ID")

ADS_API = "https://advertising-api.amazon.com"


def get_access_token() -> str:
    resp = requests.post(
        "https://api.amazon.com/auth/o2/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": REFRESH_TOKEN,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
    ).json()
    return resp.get("access_token")


def headers(access_token: str, content_type: str = "application/json") -> dict:
    return {
        "Amazon-Advertising-API-ClientId": CLIENT_ID,
        "Authorization": f"Bearer {access_token}",
        "Amazon-Advertising-API-Scope": PROFILE_ID,
        "Content-Type": content_type,
    }


def default_dates() -> tuple[str, str]:
    end = datetime.today()
    start = end - timedelta(days=30)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def enrich(row: dict) -> dict:
    cost = float(row.get("cost") or 0)
    sales = float(row.get("sales7d") or 0)
    clicks = int(row.get("clicks") or 0)
    impressions = int(row.get("impressions") or 0)
    row["roas"] = round(sales / cost, 2) if cost > 0 else 0
    row["acos_pct"] = round(cost / sales * 100, 2) if sales > 0 else None
    row["ctr_pct"] = round(clicks / impressions * 100, 2) if impressions > 0 else 0
    row["cpc"] = round(cost / clicks, 2) if clicks > 0 else 0
    return row


def run_report(
    report_type_id: str,
    group_by: list[str],
    columns: list[str],
    start_date: str,
    end_date: str,
    timeout_seconds: int = 300,
) -> list[dict] | str:
    token = get_access_token()
    h = headers(token)

    # Create report
    payload = {
        "name": f"{report_type_id}_{start_date}_{end_date}",
        "startDate": start_date,
        "endDate": end_date,
        "configuration": {
            "adProduct": "SPONSORED_PRODUCTS",
            "groupBy": group_by,
            "columns": columns,
            "reportTypeId": report_type_id,
            "timeUnit": "SUMMARY",
            "format": "GZIP_JSON",
        },
    }
    r = requests.post(f"{ADS_API}/reporting/reports", headers=h, json=payload)
    if r.status_code not in (200, 202):
        return f"Report creation failed: {r.status_code} — {r.text}"

    report_id = r.json().get("reportId")

    # Poll until done
    elapsed = 0
    interval = 10
    download_url = None
    while elapsed < timeout_seconds:
        time.sleep(interval)
        elapsed += interval
        status_r = requests.get(f"{ADS_API}/reporting/reports/{report_id}", headers=h)
        body = status_r.json()
        status = body.get("status")
        if status == "COMPLETED":
            download_url = body.get("url")
            break
        if status == "FAILED":
            return f"Report generation failed: {body}"

    if not download_url:
        return f"Report timed out after {timeout_seconds}s (reportId={report_id})"

    # Download + decompress
    raw = requests.get(download_url).content
    data = json.loads(gzip.decompress(raw))
    return [enrich(row) for row in data]


# ─── LISTING TOOLS ────────────────────────────────────────────────────────────

@mcp.tool()
def list_campaigns() -> str:
    """Lists all Sponsored Products campaigns with budget and state."""
    token = get_access_token()
    r = requests.post(
        f"{ADS_API}/sp/campaigns/list",
        headers={**headers(token), "Content-Type": "application/vnd.spCampaign.v3+json", "Accept": "application/vnd.spCampaign.v3+json"},
        json={},
    )
    if r.status_code == 200:
        return json.dumps(r.json(), ensure_ascii=False, indent=2)
    return f"Error {r.status_code}: {r.text}"


@mcp.tool()
def list_ad_groups(campaign_id: str = "") -> str:
    """Lists ad groups. Optionally filter by campaign_id."""
    token = get_access_token()
    payload = {}
    if campaign_id:
        payload["campaignIdFilter"] = {"include": [campaign_id]}
    r = requests.post(
        f"{ADS_API}/sp/adGroups/list",
        headers={**headers(token), "Content-Type": "application/vnd.spAdGroup.v3+json", "Accept": "application/vnd.spAdGroup.v3+json"},
        json=payload,
    )
    if r.status_code == 200:
        return json.dumps(r.json(), ensure_ascii=False, indent=2)
    return f"Error {r.status_code}: {r.text}"


@mcp.tool()
def list_keywords(campaign_id: str = "", ad_group_id: str = "") -> str:
    """Lists keywords with bids and match types. Filter by campaign_id or ad_group_id."""
    token = get_access_token()
    payload: dict = {}
    if campaign_id:
        payload["campaignIdFilter"] = {"include": [campaign_id]}
    if ad_group_id:
        payload["adGroupIdFilter"] = {"include": [ad_group_id]}
    r = requests.post(
        f"{ADS_API}/sp/keywords/list",
        headers={**headers(token), "Content-Type": "application/vnd.spKeyword.v3+json", "Accept": "application/vnd.spKeyword.v3+json"},
        json=payload,
    )
    if r.status_code == 200:
        return json.dumps(r.json(), ensure_ascii=False, indent=2)
    return f"Error {r.status_code}: {r.text}"


@mcp.tool()
def list_product_ads(campaign_id: str = "", ad_group_id: str = "") -> str:
    """Lists advertised products (ASINs/SKUs). Filter by campaign_id or ad_group_id."""
    token = get_access_token()
    payload: dict = {}
    if campaign_id:
        payload["campaignIdFilter"] = {"include": [campaign_id]}
    if ad_group_id:
        payload["adGroupIdFilter"] = {"include": [ad_group_id]}
    r = requests.post(
        f"{ADS_API}/sp/productAds/list",
        headers={**headers(token), "Content-Type": "application/vnd.spProductAd.v3+json", "Accept": "application/vnd.spProductAd.v3+json"},
        json=payload,
    )
    if r.status_code == 200:
        return json.dumps(r.json(), ensure_ascii=False, indent=2)
    return f"Error {r.status_code}: {r.text}"


# ─── PERFORMANCE REPORT TOOLS ─────────────────────────────────────────────────

@mcp.tool()
def get_campaigns_report(start_date: str = "", end_date: str = "") -> str:
    """
    Campaign-level performance: impressions, clicks, spend, orders, revenue,
    ROAS, ACoS, CTR, CPC. Defaults to last 30 days.
    """
    s, e = (start_date, end_date) if start_date and end_date else default_dates()
    result = run_report(
        report_type_id="spCampaigns",
        group_by=["campaign"],
        columns=[
            "campaignId", "campaignName", "campaignStatus",
            "campaignBudgetAmount", "campaignBudgetType", "campaignBudgetCurrencyCode",
            "impressions", "clicks", "cost",
            "purchases7d", "sales7d", "unitsSoldClicks7d",
        ],
        start_date=s,
        end_date=e,
    )
    if isinstance(result, str):
        return result
    return json.dumps({"period": f"{s} / {e}", "campaigns": result}, ensure_ascii=False, indent=2)


@mcp.tool()
def get_ad_groups_report(start_date: str = "", end_date: str = "") -> str:
    """
    Ad group-level performance: impressions, clicks, spend, orders, revenue,
    ROAS, ACoS, CTR, CPC. Defaults to last 30 days.
    """
    s, e = (start_date, end_date) if start_date and end_date else default_dates()
    result = run_report(
        report_type_id="spAdvertisedProduct",
        group_by=["advertiser"],
        columns=[
            "campaignId", "campaignName",
            "advertisedAsin", "advertisedSku",
            "impressions", "clicks", "cost",
            "purchases7d", "sales7d", "unitsSoldClicks7d",
            "salesOtherSku7d",
        ],
        start_date=s,
        end_date=e,
    )
    if isinstance(result, str):
        return result
    return json.dumps({"period": f"{s} / {e}", "ad_groups": result}, ensure_ascii=False, indent=2)


@mcp.tool()
def get_keywords_report(start_date: str = "", end_date: str = "") -> str:
    """
    Keyword-level performance: keyword text, match type, bid, impressions,
    clicks, spend, orders, revenue, ROAS, ACoS, CTR, CPC. Defaults to last 30 days.
    """
    s, e = (start_date, end_date) if start_date and end_date else default_dates()
    result = run_report(
        report_type_id="spKeywords",
        group_by=["adGroup"],
        columns=[
            "keywordId", "keyword", "keywordText", "matchType",
            "impressions", "clicks", "cost",
            "purchases7d", "sales7d", "unitsSoldClicks7d",
        ],
        start_date=s,
        end_date=e,
    )
    if isinstance(result, str):
        return result
    return json.dumps({"period": f"{s} / {e}", "keywords": result}, ensure_ascii=False, indent=2)


@mcp.tool()
def get_search_terms_report(start_date: str = "", end_date: str = "") -> str:
    """
    Search term-level performance: actual customer search queries, their matched
    keyword, spend, orders, ROAS. Defaults to last 30 days.
    """
    s, e = (start_date, end_date) if start_date and end_date else default_dates()
    result = run_report(
        report_type_id="spSearchTerm",
        group_by=["searchTerm"],
        columns=[
            "campaignId", "campaignName",
            "adGroupId", "adGroupName",
            "keyword", "matchType", "searchTerm",
            "impressions", "clicks", "cost",
            "purchases7d", "sales7d", "unitsSoldClicks7d",
        ],
        start_date=s,
        end_date=e,
    )
    if isinstance(result, str):
        return result
    return json.dumps({"period": f"{s} / {e}", "search_terms": result}, ensure_ascii=False, indent=2)


@mcp.tool()
def get_products_report(start_date: str = "", end_date: str = "") -> str:
    """
    Product/ASIN-level performance: which ASINs are being advertised,
    their spend, orders, revenue, ROAS. Defaults to last 30 days.
    """
    s, e = (start_date, end_date) if start_date and end_date else default_dates()
    result = run_report(
        report_type_id="spAdvertisedProduct",
        group_by=["advertiser"],
        columns=[
            "campaignId", "campaignName",
            "adGroupId", "adGroupName",
            "advertisedAsin", "advertisedSku",
            "impressions", "clicks", "cost",
            "purchases7d", "sales7d", "unitsSoldClicks7d",
            "salesOtherSku7d", "unitsSoldOtherSku7d",
        ],
        start_date=s,
        end_date=e,
    )
    if isinstance(result, str):
        return result
    return json.dumps({"period": f"{s} / {e}", "products": result}, ensure_ascii=False, indent=2)


# ─── OPTIMIZATION AGENT TOOLS ────────────────────────────────────────────────

@mcp.tool()
def analyze_bid_performance(acos_threshold: float = 30.0, roas_threshold: float = 3.0) -> str:
    """
    Fetches keyword-level performance for the last 30 days and returns
    underperforming keywords that need bid adjustments.
    Flags keywords where ACoS > acos_threshold (default 30%), ROAS < roas_threshold (default 3),
    or spend > $10 with zero sales.
    Use this data to recommend specific bid increases or decreases for each flagged keyword.
    """
    s, e = default_dates()
    data = run_report(
        report_type_id="spKeywords",
        group_by=["adGroup"],
        columns=[
            "campaignName", "adGroupName", "keywordText", "matchType",
            "impressions", "clicks", "cost", "purchases7d", "sales7d",
        ],
        start_date=s, end_date=e,
    )
    if isinstance(data, str):
        return data

    flagged = [
        row for row in data
        if (row.get("acos_pct") or 0) > acos_threshold
        or (float(row.get("cost") or 0) > 0 and (row.get("roas") or 0) < roas_threshold)
        or (float(row.get("cost") or 0) > 10 and not float(row.get("sales7d") or 0))
    ]

    return json.dumps({
        "period": f"{s} / {e}",
        "criteria": {
            "acos_threshold_pct": acos_threshold,
            "roas_threshold": roas_threshold,
            "min_spend_no_sales": 10,
        },
        "flagged_count": len(flagged),
        "total_keywords": len(data),
        "keywords": flagged,
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def analyze_keyword_health() -> str:
    """
    Fetches keyword performance for the last 30 days and returns keywords
    that may need to be paused, added as negatives, or replaced.
    Flags keywords with zero clicks, CTR < 0.1%, or spend > $5 with zero sales.
    Use this data to recommend pause / add-as-negative / keep actions for each keyword.
    """
    s, e = default_dates()
    data = run_report(
        report_type_id="spKeywords",
        group_by=["adGroup"],
        columns=[
            "campaignName", "adGroupName", "keywordText", "matchType",
            "impressions", "clicks", "cost", "purchases7d", "sales7d",
        ],
        start_date=s, end_date=e,
    )
    if isinstance(data, str):
        return data

    flagged = [
        row for row in data
        if int(row.get("clicks") or 0) == 0
        or (row.get("ctr_pct") or 0) < 0.1
        or (float(row.get("cost") or 0) > 5 and not float(row.get("sales7d") or 0))
    ]

    return json.dumps({
        "period": f"{s} / {e}",
        "criteria": {
            "zero_clicks": True,
            "ctr_below_pct": 0.1,
            "spend_no_sales_threshold": 5,
        },
        "flagged_count": len(flagged),
        "total_keywords": len(data),
        "keywords": flagged,
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def analyze_budget_efficiency() -> str:
    """
    Fetches campaign-level spend and performance for the last 30 days.
    Flags campaigns that are budget-capped (spend >= 90% of monthly budget)
    or have poor ROAS (< 1). Use this data to recommend budget reallocations
    across campaigns — increase budgets for high-ROAS capped campaigns,
    reduce for low-ROAS underspenders.
    """
    s, e = default_dates()
    data = run_report(
        report_type_id="spCampaigns",
        group_by=["campaign"],
        columns=[
            "campaignName", "campaignBudgetAmount", "campaignBudgetType",
            "impressions", "clicks", "cost", "purchases7d", "sales7d",
        ],
        start_date=s, end_date=e,
    )
    if isinstance(data, str):
        return data

    enriched = []
    for row in data:
        budget = float(row.get("campaignBudgetAmount") or 0)
        spend = float(row.get("cost") or 0)
        period_budget = budget * 30
        row["budget_utilization_pct"] = round(spend / period_budget * 100, 1) if period_budget > 0 else 0
        enriched.append(row)

    flagged = [
        row for row in enriched
        if row["budget_utilization_pct"] >= 90
        or (row.get("roas") or 0) < 1
    ]

    return json.dumps({
        "period": f"{s} / {e}",
        "criteria": {
            "budget_cap_threshold_pct": 90,
            "poor_roas_threshold": 1,
        },
        "flagged_count": len(flagged),
        "total_campaigns": len(enriched),
        "campaigns": flagged,
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def analyze_search_terms() -> str:
    """
    Fetches search term report for the last 30 days.
    Flags high-converting terms (orders >= 2) that should be added as exact-match keywords,
    and wasteful terms (spend > $5 with zero orders) that should be added as negatives.
    Use this data to recommend 'Add as Exact Keyword', 'Add as Negative', or 'Monitor' actions.
    """
    s, e = default_dates()
    data = run_report(
        report_type_id="spSearchTerm",
        group_by=["searchTerm"],
        columns=[
            "campaignName", "adGroupName", "keywordText", "matchType", "searchTerm",
            "impressions", "clicks", "cost", "purchases7d", "sales7d",
        ],
        start_date=s, end_date=e,
    )
    if isinstance(data, str):
        return data

    flagged = [
        row for row in data
        if int(row.get("purchases7d") or 0) >= 2
        or (float(row.get("cost") or 0) > 5 and not int(row.get("purchases7d") or 0))
    ]

    return json.dumps({
        "period": f"{s} / {e}",
        "criteria": {
            "promote_to_keyword_min_orders": 2,
            "add_negative_spend_threshold": 5,
        },
        "flagged_count": len(flagged),
        "total_search_terms": len(data),
        "search_terms": flagged,
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def run_full_optimization() -> str:
    """
    Runs all four optimization analyses in sequence and returns a combined summary.
    Covers: bid performance, keyword health, budget efficiency, and search term analysis.
    Use the returned data to produce a full Markdown optimization report with four sections,
    one for each analysis area, with concrete actionable recommendations in each.
    """
    results = {}
    for tool_fn, key in [
        (analyze_bid_performance, "bid_performance"),
        (analyze_keyword_health, "keyword_health"),
        (analyze_budget_efficiency, "budget_efficiency"),
        (analyze_search_terms, "search_terms"),
    ]:
        try:
            results[key] = json.loads(tool_fn())
        except Exception as ex:
            results[key] = {"error": str(ex)}

    today = datetime.today().strftime("%Y-%m-%d")
    return json.dumps({
        "report_date": today,
        "analysis_period": "last 30 days",
        "analyses": results,
    }, ensure_ascii=False, indent=2)


# ─── UPDATE TOOLS ─────────────────────────────────────────────────────────────

@mcp.tool()
def update_campaign_budget(campaign_id: str, new_budget: float) -> str:
    """Updates the daily budget of a campaign."""
    token = get_access_token()
    r = requests.put(
        f"{ADS_API}/sp/campaigns",
        headers={**headers(token), "Content-Type": "application/vnd.spCampaign.v3+json", "Accept": "application/vnd.spCampaign.v3+json"},
        json=[{"campaignId": campaign_id, "budget": {"budgetType": "DAILY", "budget": new_budget}}],
    )
    if r.status_code in (200, 207):
        return f"Campaign {campaign_id} budget updated to ${new_budget}."
    return f"Update failed: {r.text}"


@mcp.tool()
def update_keyword_bid(keyword_id: str, new_bid: float) -> str:
    """Updates the bid of a specific keyword."""
    token = get_access_token()
    r = requests.put(
        f"{ADS_API}/sp/keywords",
        headers={**headers(token), "Content-Type": "application/vnd.spKeyword.v3+json", "Accept": "application/vnd.spKeyword.v3+json"},
        json=[{"keywordId": keyword_id, "bid": new_bid}],
    )
    if r.status_code in (200, 207):
        return f"Keyword {keyword_id} bid updated to ${new_bid}."
    return f"Update failed: {r.text}"


if __name__ == "__main__":
    mcp.run()
