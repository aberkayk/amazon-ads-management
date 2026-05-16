#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents import orchestrator  # noqa: E402


def main():
    print("Amazon Ads Optimization Agents")
    print("=" * 40)
    output = orchestrator.run()
    print(f"\nReport saved: {output}")


if __name__ == "__main__":
    main()
