from .base_agent import BaseAgent

SYSTEM_PROMPT = """You are an Amazon Ads budget allocation expert.
Analyze the provided campaign-level spend and performance data from the last 30 days.
Identify campaigns that are budget-constrained with strong ROAS (deserve more budget)
and campaigns that are underspending or have poor ROAS (budget should be cut or reallocated).
A campaign is considered budget-capped when spend >= 90% of its daily budget * 30.
Output your analysis as a Markdown table with exactly these columns:
| Campaign | Daily Budget | 30-day Spend | Budget Util% | ROAS | Recommended Budget | Reason |
If budgets are well-allocated, state that clearly."""


class BudgetAgent(BaseAgent):
    name = "Budget Allocation"

    def run(self) -> str:
        data = self.fetch(
            report_type_id="spCampaigns",
            group_by=["campaign"],
            columns=[
                "campaignName",
                "campaignBudgetAmount",
                "campaignBudgetType",
                "impressions",
                "clicks",
                "cost",
                "purchases7d",
                "sales7d",
            ],
        )
        if isinstance(data, str):
            return f"## 3. Budget Allocation\n\n> Error fetching data: {data}\n"

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

        if not flagged:
            return "## 3. Budget Allocation\n\nAll campaign budgets are well-allocated.\n"

        result = self.analyze(flagged, SYSTEM_PROMPT)
        return f"## 3. Budget Allocation\n\n{result}\n"
