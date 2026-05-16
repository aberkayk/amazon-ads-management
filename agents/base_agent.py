import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import anthropic
from ads_server import get_access_token, run_report, default_dates  # noqa: E402

MODEL = "claude-sonnet-4-6"
_client = anthropic.Anthropic()


class BaseAgent:
    name: str = "base"

    def fetch(
        self,
        report_type_id: str,
        group_by: list[str],
        columns: list[str],
    ) -> list[dict] | str:
        start, end = default_dates()
        return run_report(report_type_id, group_by, columns, start, end)

    def analyze(self, data: list[dict], system_prompt: str) -> str:
        response = _client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": json.dumps(data)}],
        )
        return response.content[0].text

    def run(self) -> str:
        raise NotImplementedError
