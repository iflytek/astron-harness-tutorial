# doc-watch · 上游文档每日巡检

每天抓取上游文档站，与仓库基线对比，发现**新增内容 / 新增图片**，并辅助把新内容（含配图）补全到本教程站点。

## 监测的源

| 源 | 地址 | 抓取方式 |
|---|---|---|
| Loomy Docs | https://loomy.xunfei.cn/docs | VitePress SSG，自动从侧边栏发现全部页面 |
| AstronClaw 使用指南 | https://www.xfyun.cn/doc/spark/Agent-AstronClaw使用指南.html | 单页 SSR |
| AStudio 指南与协议 | https://agent.xfyun.cn/studio-guide/intro | 固定抓取 15 个 SSR 页面，正文哈希监测价格与条款变化 |

AStudio 覆盖 `intro`、`quickstart`、`features`、`cases`、`tips`、`pricing`、`faq`，以及 `agreements/` 下的 `user-service-web`、`privacy-web`、`user-service-client`、`privacy-client`、`personal-information-collection-list-zh-CN`、`third-party-sharing-list-zh-CN`、`product-subscription-service`、`auto-renewal-service`。
这些页面一并记录标题、正文哈希、图片和小节；HTTP 错误或缺少正文时不更新基线。

## 组成

```
scripts/doc-watch/
  lib.mjs               # 共享库：抓取 + HTML 解析助手（零依赖）
  check-updates.mjs     # 抓取 + 对比引擎（退出码 0/1/2）
  draft-with-openai.mjs # 可选：用 OpenAI 起草新页面+下载配图+联网检索，产出 PR 描述
  baseline/             # 基线快照（每源一个 JSON：页面 / 小节 / 图片 / 正文哈希）
    loomy.json
    astronclaw.json
    astudio.json
.github/workflows/doc-watch.yml   # 每日 cron：Issue 告警 +（可选）OpenAI 起草并开 PR
```

## 本地用法

```bash
# 巡检：与基线对比，有变化时退出码 1，并打印 Markdown 报告
node scripts/doc-watch/check-updates.mjs

# 把报告写到文件
node scripts/doc-watch/check-updates.mjs --report report.md

# 输出 JSON（便于程序消费）
node scripts/doc-watch/check-updates.mjs --json

# 首次创建 / 重建基线
node scripts/doc-watch/check-updates.mjs --init

# 接受当前线上状态为新基线（补全内容后执行，用于关闭巡检告警）
node scripts/doc-watch/check-updates.mjs --update

# 仅接受已人工核对的 AStudio 变更，不影响其他源的待处理报告
node scripts/doc-watch/check-updates.mjs --source astudio --update
```

退出码：`0` 无变化 · `1` 有新增/变化 · `2` 抓取失败。

单个页面请求遇到网络错误、超时（30s）、429 或 5xx 时会指数退避重试，最多 3 次；仍失败才记为抓取异常。

## 工作机制

1. Loomy 站点是 VitePress，HTML 里直接含侧边栏全部页面链接 → 自动发现页面清单，无需浏览器。
2. 每页提取：标题、各级小节标题（h1–h4）、正文图片 URL（已绝对化，过滤站点 logo）、正文文本哈希。
3. 与 `baseline/*.json` 对比，输出：🆕 新增页面 / ✏️ 内容变化（含新增小节、新增图片）/ 🗑️ 下线页面。
4. 基线提交在仓库里；补全内容的 PR 顺带 `--update` 刷新基线，避免重复告警。

## 两层自动化

### 第一层：GitHub Actions（确定性巡检，已内置）

`.github/workflows/doc-watch.yml` 每天 01:00 UTC（北京时间 09:00）运行脚本。发现变化时，
自动维护**一条**带 `doc-watch` 标签的 Issue，列出新增页面 / 小节 / 图片 URL，供后续补全。
抓取失败（退出码 `2`）另外维护一条「⚠️ 巡检抓取失败」Issue，连续失败只追加评论并附上日志末尾；
下一次抓取成功时自动关闭。两类 Issue 按标题区分，互不覆盖。
免费、纯确定性，但不含联网搜索与自动起草。

### 第二层 A：OpenAI 起草（在 GitHub Actions 里跑你自己的 API，省 Claude 额度）✅ 推荐

`draft-with-openai.mjs` 用 **OpenAI Responses API**（自带 `web_search` 内置工具）完成
「读懂上游新页面 → 起草中英双语页面 → 下载配图 → 联网检索官方更新」，按你自己的
OpenAI key 计费，不消耗 Claude 额度。工作流在检测到变化且配置了 key 时自动调用它并开 PR。

启用步骤：

1. 仓库 **Settings → Secrets and variables → Actions**：
   - 新增 Secret `OPENAI_API_KEY` = 你的 OpenAI key。
   - （可选）新增 Variable `OPENAI_MODEL`，默认 `gpt-4.1`；须用支持 `web_search` 的模型。
2. 仓库 **Settings → Actions → General → Workflow permissions**：勾选
   **「Allow GitHub Actions to create and approve pull requests」**（否则无法自动开 PR）。
3. 之后每天若上游有新增页面，工作流会自动：起草双语页面 + 下载配图 → `npm run docs:build`
   → 开一个 `docs: 同步上游文档新增内容 (日期)` 的待审 PR。自动起草不刷新基线，避免清除尚未处理的价格、协议或其他文档变更；审阅并补齐后再手动接受对应源的基线。

本地试跑（需要 key；`--dry-run` 不调用 OpenAI、不写文件，仅打印计划）：

```bash
node scripts/doc-watch/draft-with-openai.mjs --dry-run
OPENAI_API_KEY=sk-... node scripts/doc-watch/draft-with-openai.mjs
```

护栏：只自动镜像新的 Loomy 内容页（跳过法务/隐私/索引页）；侧边栏入口与「内容有改动的
已有页面 / AstronClaw 指南 / AStudio 指南及协议」留在 PR 描述里由人工处理；PR 仅起草、不自动合并，需人工审阅。
另需 `OPENAI_BASE_URL` 时可指向 OpenAI 兼容端点。

在 Actions 手动运行时可选 `dry_run=true`：只抓取并上传报告，不创建或修改 Issue、评论或 PR，也不调用起草模型。抓取不完整会使工作流失败；成功、变化和失败的报告均保留为构件。

> ⚠️ web_search 需要联网；纯文档同步（翻译/改写上游正文）即使模型不带搜索也能完成，
> 只有「发现全网全新功能」那部分依赖 web_search。

### 第二层 B：Claude 定时云 agent（备选，消耗 Claude 额度）

如果不想用 OpenAI，也可以用一个每日 Claude routine 完成同样的「联网找新内容 + 抓图 +
起草 PR」。routine 的提示词如下（可直接用于 `/schedule` 或定时 agent）：

```
每天巡检本仓库的上游文档，发现并补全新内容：

1. 运行 `node scripts/doc-watch/check-updates.mjs --report /tmp/doc-watch.md`，读取报告。
2. 若报告显示有「新增页面 / 新增小节 / 新增图片」：
   - 对每处新内容，抓取上游对应页面与配图（图片落到 docs/public/loomy/<区域>/ 或
     docs/public/astronclaw/，本地引用而非外链）。
   - 按现有页面风格写成中文页面，并补一份等价的英文页面（docs/ 与 docs/en/）。
   - 需要时更新 docs/.vitepress/config.mts 的中英侧边栏。
3. 此外，联网搜索 Loomy / 讯飞 AstronClaw 的近期官方更新（发布说明、新功能、新渠道、
   新技能），判断是否有本站尚未覆盖、且适合补充的内容；有则一并补上并注明来源。
4. 运行 `npm run docs:build` 确认死链检查通过、搜索索引重新生成。
5. 运行 `node scripts/doc-watch/check-updates.mjs --update` 刷新基线。
6. 新建分支并开 PR，标题 `docs: 同步上游文档新增内容 (<日期>)`，PR 描述列出每处新增的来源链接。
   遵循仓库约定：提交与 PR 不得包含任何 AI 署名。
   若本次无任何新增，则不创建 PR，仅留一句说明。
```

> 说明：联网搜索与「读懂新内容→翻译成双语页面→挑选配图」需要判断力，必须由带联网与
> 写作能力的 agent 完成；纯 CI 只能做到确定性 diff + 告警。两层配合即可覆盖
> 「抓取 + 对比 + 配图 + 联网补全」的完整需求。
