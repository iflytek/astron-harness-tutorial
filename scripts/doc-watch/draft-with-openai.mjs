#!/usr/bin/env node
/**
 * doc-watch · OpenAI 起草器
 *
 * 在确定性巡检（check-updates.mjs）发现上游有新增页面时，用 OpenAI 把新内容起草成
 * 中英双语 VitePress 页面，下载配图到本地，并用 OpenAI 的 web_search 工具联网搜索
 * Loomy / AstronClaw 近期官方更新，最后产出一份 PR 描述。开 PR 的动作由工作流完成。
 *
 * 为什么用 OpenAI：其 Responses API 自带 web_search 内置工具，且按你自己的 API 计费，
 * 不消耗 Claude 额度。
 *
 * 用法：
 *   OPENAI_API_KEY=sk-... node scripts/doc-watch/draft-with-openai.mjs
 *   node scripts/doc-watch/draft-with-openai.mjs --dry-run   # 不调用 OpenAI、不写文件，只打印计划
 *
 * 环境变量：
 *   OPENAI_API_KEY   必填（--dry-run 时可省）
 *   OPENAI_MODEL     选填，默认 gpt-4.1（联网搜索需用支持 web_search 的模型）
 *   OPENAI_BASE_URL  选填，默认 https://api.openai.com/v1（可指向兼容端点）
 *
 * 退出码：0 无新增/已完成 · 1 起草过程中有错误 · 2 致命错误（如缺 key）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fetchText, extractMain, extractImages, absolutize } from './lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

const DRY_RUN = process.argv.includes('--dry-run');
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1';
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const PR_BODY_FILE = path.join(REPO_ROOT, 'doc-watch-draft-pr.md');

const LOOMY_ORIGIN = 'https://loomy.xunfei.cn';

if (!DRY_RUN && !KEY) {
  process.stderr.write('[draft] 缺少 OPENAI_API_KEY。\n');
  process.exit(2);
}

// ---------- OpenAI Responses API ----------

async function openai(input, { webSearch = false } = {}) {
  if (DRY_RUN) return '[dry-run: OpenAI 调用被跳过]';
  const body = { model: MODEL, input };
  if (webSearch) body.tools = [{ type: 'web_search' }];
  const res = await fetch(`${BASE_URL}/responses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  if (typeof data.output_text === 'string' && data.output_text) return data.output_text;
  if (Array.isArray(data.output)) {
    return data.output
      .flatMap((o) => (o.content || []).filter((c) => c.type === 'output_text').map((c) => c.text))
      .join('\n');
  }
  return '';
}

function parseJsonBlock(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(raw);
}

// ---------- helpers ----------

function runDiff() {
  const out = execFileSync('node', [path.join(__dirname, 'check-updates.mjs'), '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
  });
  // check-updates exits 1 on changes; execFileSync throws but still has stdout on e.stdout.
  return JSON.parse(out);
}

function slugFromUrl(url) {
  return url.replace(/\/+$/, '').split('/').pop();
}

// Which new Loomy pages are worth auto-drafting into the tutorial.
function isDraftablePage(url) {
  if (!/loomy\.xunfei\.cn\/docs\//.test(url)) return false;
  if (/\/docs\/Safe\//i.test(url)) return false; // 法务/隐私页不镜像进教程
  if (/\/docs\/?$/.test(url) || /\/docs\/introduction$/.test(url)) return false;
  return true;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`图片 HTTP ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

function readSampleStyle() {
  // 给模型一个现有页面当风格样例。
  const p = path.join(REPO_ROOT, 'docs/guide/loomy/companions.md');
  try {
    return fs.readFileSync(p, 'utf-8').slice(0, 3500);
  } catch {
    return '';
  }
}

// ---------- per-page drafting ----------

async function draftPage(url, report) {
  const slug = slugFromUrl(url);
  process.stderr.write(`[draft] 起草新页面：${slug} (${url})\n`);

  const html = await fetchText(url);
  const main = extractMain(html);
  const imgUrls = extractImages(main, LOOMY_ORIGIN);

  // 下载配图到 docs/public/loomy/<slug>/，并建立 原始URL → 本地引用路径 的映射。
  const imgMap = {};
  for (const u of imgUrls) {
    const name = slugFromUrl(u);
    const local = `/loomy/${slug}/${name}`;
    const dest = path.join(REPO_ROOT, 'docs/public/loomy', slug, name);
    if (!DRY_RUN) {
      try {
        await downloadImage(u, dest);
      } catch (e) {
        report.errors.push(`图片下载失败 ${u}: ${e.message}`);
        continue;
      }
    }
    imgMap[u] = local;
    // 上游 HTML 里 img 可能是相对/绝对，统一两种写法都映射。
    imgMap[u.replace(LOOMY_ORIGIN, '')] = local;
  }

  if (DRY_RUN) {
    report.drafted.push({ slug, url, images: Object.keys(imgMap).length, dryRun: true });
    return;
  }

  const prompt = [
    '你是该教程站点的中文技术文档作者。下面是上游 Loomy 官方文档某个新页面的正文 HTML。',
    '请把它改写成本站风格的 VitePress Markdown 页面，并产出等价的英文版本。',
    '',
    '要求：',
    '- 严格依据给定 HTML 的内容，不要杜撰功能或步骤。',
    '- 图片必须使用下面给出的【本地路径映射】，不要使用 http 外链。',
    '- 风格对齐下方“风格样例”：一级标题、二级/三级小节、> 提示块、有序/无序步骤、图片用 ![说明](本地路径)。',
    '- 不要出现任何 AI/Claude/Anthropic 字样或署名。',
    '- 只输出一个 JSON（用 ```json 包裹），字段：title_zh, title_en, sidebar_label_zh, sidebar_label_en, zh_markdown, en_markdown。',
    '',
    '【本地路径映射】(原始URL => 本地引用)：',
    JSON.stringify(imgMap, null, 2),
    '',
    '【风格样例（节选）】：',
    readSampleStyle(),
    '',
    '【上游正文 HTML（节选）】：',
    main.slice(0, 12000),
  ].join('\n');

  let obj;
  try {
    obj = parseJsonBlock(await openai(prompt));
  } catch (e) {
    report.errors.push(`OpenAI 起草/解析失败 ${slug}: ${e.message}`);
    return;
  }
  if (!obj.zh_markdown || !obj.en_markdown) {
    report.errors.push(`OpenAI 返回缺少正文 ${slug}`);
    return;
  }

  const zhPath = path.join(REPO_ROOT, 'docs/guide/loomy', `${slug}.md`);
  const enPath = path.join(REPO_ROOT, 'docs/en/guide/loomy', `${slug}.md`);
  fs.writeFileSync(zhPath, obj.zh_markdown.trim() + '\n');
  fs.writeFileSync(enPath, obj.en_markdown.trim() + '\n');

  report.drafted.push({
    slug,
    url,
    images: Object.keys(imgMap).length / 2, // 映射里每图两条
    zh: `docs/guide/loomy/${slug}.md`,
    en: `docs/en/guide/loomy/${slug}.md`,
    sidebar_zh: obj.sidebar_label_zh || obj.title_zh || slug,
    sidebar_en: obj.sidebar_label_en || obj.title_en || slug,
  });
}

// ---------- main ----------

async function main() {
  const report = { drafted: [], manual: [], webSearch: '', errors: [] };

  let diff;
  try {
    diff = runDiff();
  } catch (e) {
    // check-updates 退出码 1（有变化）会让 execFileSync 抛错，但 stdout 仍是 JSON。
    if (e.stdout) {
      try {
        diff = JSON.parse(e.stdout);
      } catch {
        process.stderr.write(`[draft] 无法解析巡检 JSON：${e.message}\n`);
        process.exit(2);
      }
    } else {
      process.stderr.write(`[draft] 运行巡检失败：${e.message}\n`);
      process.exit(2);
    }
  }

  const loomy = diff.find((d) => d.source === 'loomy');
  const astron = diff.find((d) => d.source === 'astronclaw');
  const studio = diff.find((d) => d.source === 'astudio');
  for (const p of [...(studio?.changes.newPages || []), ...(studio?.changes.changedPages || [])]) {
    report.manual.push(`AStudio 页面有改动（含套餐与协议，请人工核对）：${p.title} — ${p.url}`);
  }
  for (const url of studio?.changes.removedPages || []) report.manual.push(`AStudio 页面已下线：${url}`);

  const newDraftable = (loomy?.changes.newPages || []).filter((p) => isDraftablePage(p.url));

  // 起草可直接落地的新 Loomy 页面
  for (const p of newDraftable) {
    try {
      await draftPage(p.url, report);
    } catch (e) {
      report.errors.push(`起草 ${p.url} 异常：${e.message}`);
    }
  }

  // 变化的页面 / AstronClaw / 法务页 等留给人工
  for (const p of loomy?.changes.changedPages || []) {
    report.manual.push(`Loomy 页面有改动（需人工合并）：${p.title} — ${p.url}`);
  }
  for (const p of (loomy?.changes.newPages || []).filter((x) => !isDraftablePage(x.url))) {
    report.manual.push(`新页面但未自动镜像（法务/索引页）：${p.url}`);
  }
  if (astron && (astron.changes.newPages.length || astron.changes.changedPages.length)) {
    report.manual.push('AstronClaw 使用指南有改动，请人工核对并更新 docs/guide/astronclaw/*。');
  }

  // 联网搜索：仅在确有上游改动时调用，避免无谓花费
  const hasAnyChange =
    newDraftable.length || report.manual.length || (loomy && loomy.changes.changedPages.length);
  if (hasAnyChange) {
    try {
      report.webSearch = await openai(
        '用中文联网搜索讯飞 AStudio（agent.xfyun.cn/studio-guide）、Loomy（loomy.xunfei.cn）与 AstronClaw（星辰智能体）近 1-2 周的官方更新：' +
          '新功能、新消息渠道、新技能、版本发布说明等。只列“可能尚未写进教程、值得补充”的要点，' +
          '每条一句话并附来源链接；没有可靠新信息就回复“暂无”。',
        { webSearch: true }
      );
    } catch (e) {
      report.errors.push(`联网搜索失败：${e.message}`);
    }
  }

  // 产出 PR 描述（保持中立，不含任何 AI/自动生成署名）
  const lines = ['## 上游文档同步', ''];
  if (report.drafted.length) {
    lines.push('### 已自动起草的新页面');
    for (const d of report.drafted) {
      lines.push(`- **${d.sidebar_zh || d.slug}** ← ${d.url}`);
      if (!d.dryRun) lines.push(`  - ${d.zh} / ${d.en}（配图 ${d.images} 张）`);
    }
    lines.push('');
    lines.push('> ⚠️ 侧边栏需人工在 `docs/.vitepress/config.mts` 增加入口：');
    for (const d of report.drafted) {
      lines.push(`> - 中文：\`{ text: '${d.sidebar_zh || d.slug}', link: '/guide/loomy/${d.slug}' }\``);
      lines.push(`> - English：\`{ text: '${d.sidebar_en || d.slug}', link: '/en/guide/loomy/${d.slug}' }\``);
    }
    lines.push('');
  }
  if (report.manual.length) {
    lines.push('### 需人工处理', ...report.manual.map((m) => `- ${m}`), '');
  }
  if (report.webSearch) {
    lines.push('### 🔎 联网搜索到的潜在新内容', '', report.webSearch, '');
  }
  if (report.errors.length) {
    lines.push('### ⚠️ 起草过程中的错误', ...report.errors.map((e) => `- ${e}`), '');
  }
  lines.push('---', '_上游文档同步流程产出，请审阅后再合并。_');
  const body = lines.join('\n');
  fs.writeFileSync(PR_BODY_FILE, body + '\n');

  process.stdout.write(body + '\n');
  // 供工作流判断是否有可提交的改动：drafted 非空即有文件变化
  process.stderr.write(`[draft] drafted=${report.drafted.length} manual=${report.manual.length} errors=${report.errors.length}\n`);
  process.exit(report.errors.length ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write(`[draft] fatal: ${e.stack || e}\n`);
  process.exit(2);
});
