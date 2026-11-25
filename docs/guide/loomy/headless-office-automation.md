# 无界面周报自动化：云端规划 + 本地执行

这篇教程完成一个可复现的流程：让 AstronClaw 负责拆解“根据 `data.csv` 生成本周项目报告”的目标，再让本地 Loomy 通过一个权限收敛的 MCP 工具生成并校验 `.docx`。整个执行过程不打开 Word，也不向云端暴露本地目录。

> **能力边界**：当前公开文档没有承诺 AstronClaw 可通过专用 API 直接驱动 Loomy。本文使用两种已有入口传递任务：手动复制结构化计划，或通过[远程控制](/guide/loomy/remote-control)中已配置的消息渠道把计划发给保持后台运行的 Loomy。不要把示例理解为未公开的云桌面直连 API。

## 工作流

| 阶段 | 执行者 | 产物 |
|---|---|---|
| 规划 | AstronClaw | 只包含文件名、截止日期和标题的 JSON 计划 |
| 交接 | 你或远程控制渠道 | 将计划发送给本地 Loomy |
| 执行 | Loomy + 本地 MCP | 读取授权目录中的 CSV，生成 DOCX |
| 验证 | 本地 MCP | 返回行数、文件大小和 SHA-256；失败时不替换旧文件 |

示例没有提供任意终端执行或任意文件读写。MCP 服务只有“检查 CSV”和“生成周报”两个工具，所有路径必须位于 `REPORT_WORKSPACE` 内。

## 1. 准备示例

下载或克隆本仓库，进入 [`examples/headless-weekly-report`](https://github.com/iflytek/astronclaw-tutorial/tree/main/examples/headless-weekly-report)：

```powershell
cd examples\headless-weekly-report
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
```

macOS/Linux 将最后一条命令换成：

```bash
.venv/bin/python -m pip install -r requirements.txt
```

示例依赖[官方 MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) 2.x 和 `python-docx`。输入文件是 `workspace/data.csv`，必需列为：

```text
project,status,progress,next_step,owner
```

先绕过 Loomy 直接验证本地构建链路：

```powershell
.\.venv\Scripts\python report_builder.py `
  --workspace workspace `
  --source data.csv `
  --output weekly-report-2026-09-04.docx `
  --week-ending 2026-09-04 `
  --title "项目周报"
```

macOS/Linux 使用反斜杠续行和 `.venv/bin/python`。成功时会输出类似：

```json
{
  "output": "weekly-report-2026-09-04.docx",
  "week_ending": "2026-09-04",
  "row_count": 3,
  "size_bytes": 37142,
  "sha256": "..."
}
```

## 2. 接入 Loomy 工具箱

进入 Loomy 的「设置」→「工具箱」，导入外部自定义 MCP 配置。把下面所有路径改成你的**绝对路径**。

Windows：

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

macOS/Linux：

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

保存后重启或刷新该工具，并把两个新工具的权限设为「询问」。详见[工具箱与技能系统](/guide/loomy/toolbox)。

## 3. 让 AstronClaw 生成执行计划

在 AstronClaw 中发送：

> 把“根据 data.csv 生成本周项目周报”拆成一份交给桌面执行器的 JSON 计划。只允许使用相对文件名；输出字段必须是 source_csv、output_docx、week_ending、title。不要生成 shell 命令，不要包含文件内容或凭据。

检查返回结果后再传给 Loomy，例如：

```json
{
  "source_csv": "data.csv",
  "output_docx": "weekly-report-2026-09-04.docx",
  "week_ending": "2026-09-04",
  "title": "项目周报"
}
```

如果使用消息渠道远程触发，Loomy 必须在本地保持后台运行；本地设备离线时不要把任务标记为完成。

## 4. 在 Loomy 中执行与确认

将 JSON 计划发送给 Loomy，并补充这段指令：

> 先调用 `inspect_weekly_report_source` 检查输入结构并告诉我行数和状态分布。确认无误后，调用 `build_weekly_report`。如果目标文件已存在，先询问我，不得自动设置 overwrite。完成后返回 output、size_bytes 和 sha256；不要声称已经打开或人工检查 Word 文件。

正常链路是：

1. Loomy 检查 `data.csv`，但不读取授权目录外的文件。
2. 你确认摘要和目标文件名。
3. 工具先在同目录写临时 DOCX，校验 ZIP/Open XML 结构后再原子替换目标。
4. Loomy 返回可核对的文件元数据。你可在文件管理器中打开最终文档抽查排版。

## 5. 错误处理闭环

- **找不到 CSV**：把文件放入 `REPORT_WORKSPACE`，仍只传相对文件名，然后重新检查。
- **缺少列**：按错误列名修改表头；不要让模型猜列的含义。
- **目标已存在**：换一个带日期的文件名，或在你明确确认后设置 `overwrite=true`。
- **DOCX 生成失败**：旧文件不会被替换，临时文件会被清理；修复输入或依赖后重试。
- **MCP 不可用**：检查配置是否使用绝对路径，并在终端运行 `.venv\Scripts\mcp.exe --help`（macOS/Linux 为 `.venv/bin/mcp --help`）。

## 安全清单

- 为周报单独创建工作目录，不要授权整个用户目录或磁盘。
- 工具权限设为「询问」，覆盖文件必须二次确认。
- CSV 中不要存密码、Token、身份证号或不需要进入周报的个人信息。
- 本示例不调用 shell、不接受命令字符串、不访问网络，并拒绝绝对路径和 `..` 越界路径。
- SHA-256 证明本次生成后文件未变化，但不代表内容真实；发布前仍需负责人审核数据与措辞。

## 复现测试

```powershell
.\.venv\Scripts\python -m unittest -v test_report_builder.py
```

测试覆盖 CSV 契约、目录越界、DOCX 结构校验和显式覆盖保护。这样，“规划—执行—验证”每一步都有可观察结果，而不是只根据对话文本判断任务成功。
