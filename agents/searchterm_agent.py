from .base_agent import BaseAgent

SYSTEM_PROMPT = """You are an Amazon Ads search term analysis expert.
Analyze the provided search term report data from the last 30 days.
Identify high-converting search terms that should be added as exact-match keywords,
and wasteful search terms that should be added as negative keywords to stop wasted spend.
Output your analysis as a Markdown table with exactly these columns:
| Search Term | Matched Keyword | Campaign | Spend | Clicks | Orders | Action | Reason |
Action must be one of: Add as Exact Keyword | Add as Negative | Monitor | Keep
If no significant actions are needed, state that clearly."""


class SearchTermAgent(BaseAgent):
    name = "Search Term Analysis"

    def run(self) -> str:
        data = self.fetch(
            report_type_id="spSearchTerm",
            group_by=["searchTerm"],
            columns=[
                "campaignName",
                "adGroupName",
                "keywordText",
                "matchType",
                "searchTerm",
                "impressions",
                "clicks",
                "cost",
                "purchases7d",
                "sales7d",
            ],
        )
        if isinstance(data, str):
            return f"## 4. Search Term Analysis\n\n> Error fetching data: {data}\n"

        flagged = [
            row for row in data
            if int(row.get("purchases7d") or 0) >= 2
            or (float(row.get("cost") or 0) > 5 and not int(row.get("purchases7d") or 0))
        ]

        if not flagged:
            return "## 4. Search Term Analysis\n\nNo significant search term actions needed at this time.\n"

        result = self.analyze(flagged, SYSTEM_PROMPT)
        return f"## 4. Search Term Analysis\n\n{result}\n"
