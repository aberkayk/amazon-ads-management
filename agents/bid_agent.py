from .base_agent import BaseAgent

SYSTEM_PROMPT = """You are an Amazon Ads bid optimization expert.
Analyze the provided keyword-level performance metrics for Sponsored Products campaigns.
For each underperforming keyword — defined as ACoS > 30%, ROAS < 3, or spend > $10 with zero sales — recommend a specific bid adjustment.
Be concrete: state the exact recommended bid value, not just a direction.
Output your analysis as a Markdown table with exactly these columns:
| Keyword | Campaign | Match Type | Current Bid | Recommended Bid | ACoS% | ROAS | Reason |
If there are no underperforming keywords, state that clearly."""


class BidAgent(BaseAgent):
    name = "Bid Optimization"

    def run(self) -> str:
        data = self.fetch(
            report_type_id="spKeywords",
            group_by=["adGroup"],
            columns=[
                "campaignName",
                "adGroupName",
                "keywordText",
                "matchType",
                "impressions",
                "clicks",
                "cost",
                "purchases7d",
                "sales7d",
            ],
        )
        if isinstance(data, str):
            return f"## 1. Bid Optimization\n\n> Error fetching data: {data}\n"

        filtered = [
            row for row in data
            if (row.get("acos_pct") or 0) > 30
            or (row.get("roas") or 0) < 3
            or (float(row.get("cost") or 0) > 10 and not float(row.get("sales7d") or 0))
        ]

        if not filtered:
            return "## 1. Bid Optimization\n\nNo underperforming keywords found in the last 30 days.\n"

        result = self.analyze(filtered, SYSTEM_PROMPT)
        return f"## 1. Bid Optimization\n\n{result}\n"
