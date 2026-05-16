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
