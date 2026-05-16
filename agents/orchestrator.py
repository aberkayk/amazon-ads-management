from datetime import datetime
from pathlib import Path

from .bid_agent import BidAgent
from .keyword_agent import KeywordAgent
from .budget_agent import BudgetAgent
from .searchterm_agent import SearchTermAgent

AGENTS = [BidAgent, KeywordAgent, BudgetAgent, SearchTermAgent]


def run() -> Path:
    today = datetime.today().strftime("%Y-%m-%d")
    now = datetime.today().strftime("%Y-%m-%d %H:%M")

    sections = []
    for AgentClass in AGENTS:
        agent = AgentClass()
        print(f"  Running {agent.name}...")
        sections.append(agent.run())

    report = f"# Amazon Ads Optimization Report — {today}\n\n"
    report += f"> Analysis period: last 30 days | Generated: {now}\n\n"
    report += "---\n\n"
    report += "\n---\n\n".join(sections)

    reports_dir = Path(__file__).resolve().parent / "reports"
    reports_dir.mkdir(exist_ok=True)
    output_path = reports_dir / f"{today}-recommendations.md"
    output_path.write_text(report, encoding="utf-8")

    return output_path
