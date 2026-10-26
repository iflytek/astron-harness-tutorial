"""Narrow MCP server for the headless weekly-report example."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from mcp.server import MCPServer
from report_builder import build_report, inspect_source

mcp = MCPServer(
    "Headless weekly report",
    instructions=(
        "Inspect the CSV first. Ask the user before replacing an existing DOCX, "
        "then build and report the returned SHA-256 verification value."
    ),
)


def _workspace() -> Path:
    configured = os.environ.get("REPORT_WORKSPACE", "").strip()
    if not configured:
        raise RuntimeError("REPORT_WORKSPACE must be an absolute, dedicated directory")
    workspace = Path(configured).expanduser()
    if not workspace.is_absolute():
        raise RuntimeError("REPORT_WORKSPACE must be absolute")
    if not workspace.is_dir():
        raise RuntimeError("REPORT_WORKSPACE must already exist and be a directory")
    return workspace


@mcp.tool()
def inspect_weekly_report_source(source_csv: str = "data.csv") -> dict[str, Any]:
    """Inspect the allowed CSV and return row, status, owner, and schema details."""
    return inspect_source(_workspace(), source_csv)


@mcp.tool()
def build_weekly_report(
    output_docx: str,
    week_ending: str,
    source_csv: str = "data.csv",
    title: str = "Weekly project report",
    overwrite: bool = False,
) -> dict[str, Any]:
    """Build and verify a DOCX entirely inside REPORT_WORKSPACE."""
    return build_report(
        _workspace(), source_csv, output_docx, week_ending, title, overwrite
    )
