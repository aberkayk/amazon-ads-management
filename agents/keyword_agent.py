from .base_agent import BaseAgent

SYSTEM_PROMPT = """You are an Amazon Ads keyword management expert.
Analyze the provided keyword performance data from the last 30 days.
Identify keywords that should be paused, added as negatives, or replaced.
Also flag any gaps where new keywords could capture missed traffic.
Output your analysis as a Markdown table with exactly these columns:
| Keyword | Campaign | Match Type | Impressions | Clicks | Spend | Sales | Action | Reason |
Action must be one of: Pause | Add Negative | Keep | Suggest New
If all keywords are performing well, state that clearly."""


class KeywordAgent(BaseAgent):
    name = "Keyword Management"

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
            return f"## 2. Keyword Management\n\n> Error fetching data: {data}\n"

        filtered = [
            row for row in data
            if int(row.get("clicks") or 0) == 0
            or (row.get("ctr_pct") or 0) < 0.1
            or (float(row.get("cost") or 0) > 5 and not float(row.get("sales7d") or 0))
        ]

        if not filtered:
            return "## 2. Keyword Management\n\nAll keywords are performing within acceptable thresholds.\n"

        result = self.analyze(filtered, SYSTEM_PROMPT)
        return f"## 2. Keyword Management\n\n{result}\n"
