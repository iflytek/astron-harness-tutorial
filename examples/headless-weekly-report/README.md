# Headless weekly report example

This example gives Loomy one narrow local MCP tool instead of unrestricted
shell access. It reads a CSV and writes a verified DOCX only inside the
directory configured by `REPORT_WORKSPACE`.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python report_builder.py --workspace workspace --source data.csv --output weekly-report.docx --week-ending 2026-09-04
.\.venv\Scripts\python -m unittest -v test_report_builder.py
```

On macOS or Linux, replace `.\.venv\Scripts\python` with
`.venv/bin/python`.

## Connect to Loomy

Import a standard MCP configuration in **Settings → Toolbox**. Use absolute
paths for both the MCP executable and `mcp_server.py`, and set
`REPORT_WORKSPACE` to the absolute `workspace` directory. The bilingual
tutorial pages contain complete Windows and macOS/Linux examples.

The official MCP Python SDK uses stdio for this local server. The server must
not print application logs to stdout because stdout carries MCP protocol
messages.
