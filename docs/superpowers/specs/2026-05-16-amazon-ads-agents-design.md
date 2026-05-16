# Amazon Ads Optimization Agents — Design Spec

**Date:** 2026-05-16  
**Status:** Approved  

---

## Overview

A multi-agent system integrated into `amazon-claude-mcp` that analyzes Amazon Sponsored Products performance data and generates actionable optimization recommendations. Agents produce Markdown reports only — no changes are made to Amazon Ads automatically.

---

## File Structure

```
amazon-claude-mcp/
└── agents/
    ├── __init__.py
    ├── run.py                  # Entry point: `python agents/run.py`
    ├── orchestrator.py         # Runs all agents sequentially, merges output
    ├── base_agent.py           # Shared: Amazon data fetch + Claude API call
    ├── bid_agent.py            # Bid optimization recommendations
    ├── keyword_agent.py        # Keyword management recommendations
    ├── budget_agent.py         # Budget allocation recommendations
    ├── searchterm_agent.py     # Search term analysis recommendations
    └── reports/                # Generated reports saved here
        └── YYYY-MM-DD-recommendations.md
```

---

## Architecture

### BaseAgent (`base_agent.py`)

- Imports `get_access_token()`, `run_report()`, `enrich()` from the existing `ads_server.py` — no credential duplication.
- Holds the shared `anthropic.Anthropic()` client.
- Exposes `analyze(data, system_prompt) -> str` which calls `claude-opus-4-7` with the given data and returns a Markdown string.
- Uses the same `.env` file (`AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`, `AMAZON_REFRESH_TOKEN`, `AMAZON_PROFILE_ID`, `ANTHROPIC_API_KEY`).

```python
def analyze(self, data: list[dict], system_prompt: str) -> str:
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2048,
        system=system_prompt,
        messages=[{"role": "user", "content": json.dumps(data)}]
    )
    return response.content[0].text
```

### Orchestrator (`orchestrator.py`)

- Instantiates and runs each agent in sequence: bid → keyword → budget → searchterm.
- Collects each agent's Markdown section.
- Writes the combined report to `agents/reports/YYYY-MM-DD-recommendations.md`.

---

## Data Flow

```
python agents/run.py
        │
        ▼
orchestrator.py
        │
        ├─► bid_agent.py
        │       │ 1. Fetch campaign + keyword metrics (last 30 days)
        │       │ 2. Filter rows where ACoS > target or ROAS < threshold
        │       │ 3. Send to Claude API → get bid recommendations
        │       └─► Return Markdown section
        │
        ├─► keyword_agent.py
        │       │ 1. Fetch keyword performance report
        │       │ 2. Identify 0-click, high-spend, or low-CTR keywords
        │       │ 3. Claude API → recommend pause / add negative / suggest new
        │       └─► Return Markdown section
        │
        ├─► budget_agent.py
        │       │ 1. Fetch campaign-level spend and ROAS data
        │       │ 2. Detect budget-capped campaigns + high/low ROAS performers
        │       │ 3. Claude API → recommend budget reallocation
        │       └─► Return Markdown section
        │
        └─► searchterm_agent.py
                │ 1. Fetch search term report
                │ 2. Find high-converting terms and spend-wasting zero-sale terms
                │ 3. Claude API → recommend promote to keyword or add as negative
                └─► Return Markdown section
                        │
                        ▼
              orchestrator.py → reports/YYYY-MM-DD-recommendations.md
```

---

## Agent Details

### BidAgent
**Data fetched:** Keyword-level report — `impressions`, `clicks`, `cost`, `sales7d`, `bid`, `keywordText`, `campaignName`  
**Filter logic:** ACoS > 30% or ROAS < 3 or spend > $10 with 0 sales  
**System prompt (English):**
> You are an Amazon Ads bid optimization expert. Analyze the provided keyword metrics for a Sponsored Products campaign. For each underperforming keyword (high ACoS, low ROAS, or spend with no sales), recommend a specific bid adjustment. Output a Markdown table with columns: Keyword | Campaign | Current Bid | Recommended Bid | ACoS | Reason.

---

### KeywordAgent
**Data fetched:** Keyword performance report — `keywordText`, `matchType`, `impressions`, `clicks`, `cost`, `sales7d`, `ctr_pct`  
**Filter logic:** 0 clicks in 30 days, CTR < 0.1%, or spend > $5 with 0 sales  
**System prompt (English):**
> You are an Amazon Ads keyword management expert. Analyze the provided keyword performance data. Identify keywords to pause, add as negatives, or replace with better alternatives. Also suggest any new keyword opportunities based on patterns in the data. Output a Markdown table with columns: Keyword | Match Type | Action (Pause/Negative/Keep/New) | Reason.

---

### BudgetAgent
**Data fetched:** Campaign-level report — `campaignName`, `budget`, `cost`, `sales7d`, `roas`, `impressions`  
**Filter logic:** Campaigns where spend ≥ 95% of budget (budget-capped) or ROAS outliers  
**System prompt (English):**
> You are an Amazon Ads budget allocation expert. Analyze the provided campaign-level spend and performance data. Identify campaigns that are budget-constrained with strong ROAS (should get more budget) and campaigns that are underspending or have poor ROAS (budget should be reduced). Output a Markdown table with columns: Campaign | Current Budget | Recommended Budget | ROAS | Reason.

---

### SearchTermAgent
**Data fetched:** Search term report — `searchTerm`, `keywordText`, `impressions`, `clicks`, `cost`, `sales7d`, `orders`  
**Filter logic:** Search terms with orders > 2 (promote to keyword) or spend > $5 with 0 orders (add negative)  
**System prompt (English):**
> You are an Amazon Ads search term analysis expert. Analyze the provided search term report data. Identify high-converting search terms that should be added as exact-match keywords, and wasteful search terms that should be added as negative keywords. Output a Markdown table with columns: Search Term | Current Keyword | Action (Add as Keyword/Add as Negative/Monitor) | Spend | Orders | Reason.

---

## Output Report Format

**File:** `agents/reports/YYYY-MM-DD-recommendations.md`

```markdown
# Amazon Ads Optimization Report — YYYY-MM-DD

> Analysis period: last 30 days | Generated: YYYY-MM-DD HH:MM

## 1. Bid Optimization
| Keyword | Campaign | Current Bid | Recommended Bid | ACoS | Reason |
|---------|----------|-------------|----------------|------|--------|
| ...     | ...      | ...         | ...            | ...  | ...    |

## 2. Keyword Management
| Keyword | Match Type | Action | Reason |
|---------|-----------|--------|--------|
| ...     | ...       | ...    | ...    |

## 3. Budget Allocation
| Campaign | Current Budget | Recommended Budget | ROAS | Reason |
|----------|---------------|-------------------|------|--------|
| ...      | ...           | ...               | ...  | ...    |

## 4. Search Term Analysis
| Search Term | Current Keyword | Action | Spend | Orders | Reason |
|-------------|----------------|--------|-------|--------|--------|
| ...         | ...            | ...    | ...   | ...    | ...    |
```

---

## Dependencies

New dependency to add to the project: `anthropic`  
All other dependencies (`requests`, `python-dotenv`) already exist in the project.

New `.env` key required: `ANTHROPIC_API_KEY`

---

## Constraints

- Agents are **read-only** — no writes to Amazon Ads API.
- Analysis window is fixed at **last 30 days** (reuses `default_dates()` from `ads_server.py`).
- Triggered manually via `python agents/run.py`.
- Claude prompts are in **English**.
- Report output (table headers, labels) is in English, consistent with Claude prompts.
