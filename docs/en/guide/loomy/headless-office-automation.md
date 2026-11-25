# Headless weekly reports: cloud planning + local execution

This tutorial builds a reproducible workflow: AstronClaw decomposes the goal “create this week's project report from `data.csv`,” then local Loomy calls a narrowly scoped MCP tool to create and verify a `.docx`. Word never opens, and the local directory is not exposed to the cloud.

> **Capability boundary:** The public documentation does not promise a dedicated API through which AstronClaw directly drives Loomy. This tutorial uses two documented handoff paths: copy the structured plan manually, or send it through a message channel configured under [Remote Control](/en/guide/loomy/remote-control) to Loomy running locally in the background. Do not interpret the example as an undocumented cloud-to-desktop API.

## Workflow

| Stage | Actor | Output |
|---|---|---|
| Plan | AstronClaw | A JSON plan containing only filenames, date, and title |
| Handoff | You or a remote-control channel | The plan reaches local Loomy |
| Execute | Loomy + local MCP | Read an allowed CSV and create a DOCX |
| Verify | Local MCP | Return row count, size, and SHA-256; preserve the old file on failure |

The example does not expose arbitrary terminal or filesystem access. Its MCP server has only two tools—inspect the CSV and build the report—and every path must remain under `REPORT_WORKSPACE`.

## 1. Prepare the example

Download or clone this repository and enter [`examples/headless-weekly-report`](https://github.com/iflytek/astronclaw-tutorial/tree/main/examples/headless-weekly-report):

```powershell
cd examples\headless-weekly-report
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
```

On macOS or Linux, replace the last command with:

```bash
.venv/bin/python -m pip install -r requirements.txt
```

The example uses the [official MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) 2.x and `python-docx`. Its input is `workspace/data.csv`, with these required columns:

```text
project,status,progress,next_step,owner
```

Test the local build path before involving Loomy:

```powershell
.\.venv\Scripts\python report_builder.py `
  --workspace workspace `
  --source data.csv `
  --output weekly-report-2026-09-04.docx `
  --week-ending 2026-09-04 `
  --title "Project weekly report"
```

On macOS or Linux, use backslash line continuations and `.venv/bin/python`. A successful run returns metadata like:

```json
{
  "output": "weekly-report-2026-09-04.docx",
  "week_ending": "2026-09-04",
  "row_count": 3,
  "size_bytes": 37142,
  "sha256": "..."
}
```

## 2. Connect the tool to Loomy

In Loomy, open **Settings → Toolbox** and import an external custom MCP configuration. Replace every path below with an **absolute path**.

Windows:

```json
{
  "mcpServers": {
    "headless-weekly-report": {
      "command": "D:\\path\\to\\headless-weekly-report\\.venv\\Scripts\\mcp.exe",
      "args": [
        "run",
        "D:\\path\\to\\headless-weekly-report\\mcp_server.py"
      ],
      "env": {
        "REPORT_WORKSPACE": "D:\\path\\to\\headless-weekly-report\\workspace"
      }
    }
  }
}
```

macOS/Linux:

```json
{
  "mcpServers": {
    "headless-weekly-report": {
      "command": "/absolute/path/headless-weekly-report/.venv/bin/mcp",
      "args": ["run", "/absolute/path/headless-weekly-report/mcp_server.py"],
      "env": {
        "REPORT_WORKSPACE": "/absolute/path/headless-weekly-report/workspace"
      }
    }
  }
}
```

Save and restart or refresh the tool, then set both new tool permissions to **Ask**. See [Toolbox and Skill System](/en/guide/loomy/toolbox).

## 3. Ask AstronClaw for an execution plan

Send this to AstronClaw:

> Turn “create this week's project report from data.csv” into a JSON plan for a desktop executor. Use relative filenames only. The exact fields must be source_csv, output_docx, week_ending, and title. Do not generate shell commands, file contents, or credentials.

Inspect the answer before handing it to Loomy. For example:

```json
{
  "source_csv": "data.csv",
  "output_docx": "weekly-report-2026-09-04.docx",
  "week_ending": "2026-09-04",
  "title": "Project weekly report"
}
```

If a message channel triggers the task remotely, Loomy must remain running on the local computer. Do not mark the task complete when that computer is offline.

## 4. Execute and confirm in Loomy

Send the JSON plan to Loomy with this instruction:

> Call `inspect_weekly_report_source` first, then tell me the row count and status distribution. After I confirm, call `build_weekly_report`. If the target exists, ask me before setting overwrite. Return output, size_bytes, and sha256 when done. Do not claim that the document was opened or visually inspected.

The expected sequence is:

1. Loomy inspects `data.csv` without reading outside the allowed directory.
2. You confirm the summary and output filename.
3. The tool writes a temporary DOCX, validates its ZIP/Open XML structure, and atomically replaces the target only after validation.
4. Loomy returns verifiable file metadata. Open the final document in a file manager if you want to inspect layout.

## 5. Error-recovery loop

- **CSV not found:** place it under `REPORT_WORKSPACE`, keep using a relative filename, and inspect again.
- **Required column missing:** fix the named header; do not ask the model to guess column semantics.
- **Target exists:** choose a date-stamped filename, or set `overwrite=true` only after explicit confirmation.
- **DOCX build fails:** the old file remains intact and the temporary file is removed; fix the input or dependency and retry.
- **MCP unavailable:** confirm that every configured path is absolute, then run `.venv\Scripts\mcp.exe --help` (macOS/Linux: `.venv/bin/mcp --help`) in a terminal.

## Security checklist

- Create a dedicated report workspace; never authorize an entire home directory or disk.
- Set tool permissions to **Ask**, and require a second confirmation before overwriting output.
- Keep passwords, tokens, identity numbers, and unnecessary personal data out of the CSV.
- The example does not invoke a shell, accept command strings, or access the network. It rejects absolute and `..` escape paths.
- SHA-256 proves that the generated file has not changed since the tool returned; it does not prove the report is factually correct. A responsible owner should still review it before publication.

## Reproduce the tests

```powershell
.\.venv\Scripts\python -m unittest -v test_report_builder.py
```

The tests cover the CSV contract, directory traversal, DOCX package validation, and explicit overwrite protection. Each part of the plan–execute–verify loop therefore has an observable result instead of relying on a success claim in chat.
