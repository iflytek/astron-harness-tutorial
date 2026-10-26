#!/usr/bin/env node
/**
 * doc-watch — 每日抓取上游文档站，与本地基线快照对比，报告新增内容与图片。
 *
 * 上游源：
 *   - Loomy Docs   (VitePress SSG，侧边栏即页面清单)
 *   - AstronClaw 使用指南 (xfyun.cn，单页 SSR)
 *
 * 用法：
 *   node scripts/doc-watch/check-updates.mjs            # 抓取并与基线对比，有变化则退出码 1
 *   node scripts/doc-watch/check-updates.mjs --json      # 额外输出 JSON 报告到 stdout
 *   node scripts/doc-watch/check-updates.mjs --report f  # 把 Markdown 报告写到文件 f
 *   node scripts/doc-watch/check-updates.mjs --update     # 把当前抓取结果写回基线（接受现状）
 *   node scripts/doc-watch/check-updates.mjs --init       # 首次创建基线
 *   抓取失败退出码为 2；--init / --update 仅在所有源均抓取成功时写入基线。
 *
 * 仅依赖 Node 内置能力（fetch + fs），无第三方依赖。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES, captureSource } from './lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_DIR = path.join(__dirname, 'baseline');

// ---------- diff ----------

function diffSource(oldSnap, newSnap) {
  const changes = { newPages: [], removedPages: [], changedPages: [], errors: [] };
  const oldPages = (oldSnap && oldSnap.pages) || {};
  const newPages = newSnap.pages;

  for (const [url, p] of Object.entries(newPages)) {
    if (p.error) {
      changes.errors.push({ url, error: p.error });
      continue;
    }
    const prev = oldPages[url];
    if (!prev) {
      changes.newPages.push({ url, title: p.title, headings: p.headings, images: p.images });
      continue;
    }
    const oldHeads = new Set(prev.headings || []);
    const oldImgs = new Set(prev.images || []);
    const newHeads = (p.headings || []).filter((h) => !oldHeads.has(h));
    const newImgs = (p.images || []).filter((i) => !oldImgs.has(i));
    const textChanged = prev.textHash !== p.textHash;
    if (newHeads.length || newImgs.length || textChanged) {
      changes.changedPages.push({
        url,
        title: p.title,
        newHeadings: newHeads,
        newImages: newImgs,
        textChanged,
        textLenDelta: p.textLen - (prev.textLen || 0),
      });
    }
  }
  for (const url of Object.keys(oldPages)) {
    if (!newPages[url]) changes.removedPages.push(url);
  }
  return changes;
}

function hasChanges(c) {
  return c.newPages.length || c.removedPages.length || c.changedPages.length;
}

// ---------- report ----------

function renderReport(results) {
  const lines = [];
  lines.push('# 文档更新巡检报告', '');
  let any = false;
  let incomplete = false;
  for (const r of results) {
    lines.push(`## ${r.name}  \`(${r.source})\``, '');
    const c = r.changes;
    if (c.errors.length) {
      incomplete = true;
      lines.push('> ⚠️ 抓取异常：');
      for (const e of c.errors) lines.push(`> - ${e.url} — ${e.error}`);
      lines.push('');
    }
    if (!hasChanges(c)) {
      lines.push(c.errors.length ? '_抓取未完成，无法确认是否有新增内容。_' : '_无新增内容。_', '');
      continue;
    }
    any = true;
    if (c.newPages.length) {
      lines.push('### 🆕 新增页面');
      for (const p of c.newPages) {
        lines.push(`- **${p.title}** — ${p.url}`);
        if (p.headings?.length) lines.push(`  - 小节：${p.headings.map((h) => h.split(':').slice(1).join(':')).join(' / ')}`);
        if (p.images?.length) {
          lines.push(`  - 图片（${p.images.length}）：`);
          for (const im of p.images) lines.push(`    - ${im}`);
        }
      }
      lines.push('');
    }
    if (c.changedPages.length) {
      lines.push('### ✏️ 内容变化的页面');
      for (const p of c.changedPages) {
        lines.push(`- **${p.title}** — ${p.url}（正文字数变化 ${p.textLenDelta >= 0 ? '+' : ''}${p.textLenDelta}）`);
        if (p.newHeadings.length)
          lines.push(`  - 新增小节：${p.newHeadings.map((h) => h.split(':').slice(1).join(':')).join(' / ')}`);
        if (p.newImages.length) {
          lines.push(`  - 新增图片（${p.newImages.length}）：`);
          for (const im of p.newImages) lines.push(`    - ${im}`);
        }
      }
      lines.push('');
    }
    if (c.removedPages.length) {
      lines.push('### 🗑️ 下线/改名的页面');
      for (const u of c.removedPages) lines.push(`- ${u}`);
      lines.push('');
    }
  }
  if (incomplete) lines.push('---', '', '⚠️ 文档抓取未完成，请排查错误后重试。');
  else if (!any) lines.push('---', '', '✅ 所有文档源均无新增内容。');
  return lines.join('\n');
}

// ---------- main ----------

function baselinePath(id) {
  return path.join(BASELINE_DIR, `${id}.json`);
}
function readBaseline(id) {
  const p = baselinePath(id);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null;
}
function writeBaseline(id, snap) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
  fs.writeFileSync(baselinePath(id), JSON.stringify(snap, null, 2) + '\n');
}

async function main() {
  const args = process.argv.slice(2);
  const isInit = args.includes('--init');
  const isUpdate = args.includes('--update');
  const wantJson = args.includes('--json');
  const reportIdx = args.indexOf('--report');
  const reportFile = reportIdx >= 0 ? args[reportIdx + 1] : null;
  const sourceIdx = args.indexOf('--source');
  const sourceId = sourceIdx >= 0 ? args[sourceIdx + 1] : null;
  if (sourceIdx >= 0 && !SOURCES.some((s) => s.id === sourceId)) {
    throw new Error(`Unknown --source: ${sourceId || '(missing)'}`);
  }

  const results = [];
  for (const src of SOURCES.filter((s) => !sourceId || s.id === sourceId)) {
    process.stderr.write(`[doc-watch] capturing ${src.name} …\n`);
    const snap = await captureSource(src);
    const baseline = readBaseline(src.id);
    const changes = diffSource(baseline, snap);
    results.push({ source: src.id, name: src.name, snap, changes });
  }

  const report = renderReport(results);
  if (reportFile) fs.writeFileSync(reportFile, report + '\n');
  if (wantJson) {
    process.stdout.write(JSON.stringify(results.map((r) => ({ source: r.source, changes: r.changes })), null, 2) + '\n');
  } else {
    process.stdout.write(report + '\n');
  }

  const errors = results.flatMap((r) => r.changes.errors);
  if (errors.length) {
    for (const error of errors) {
      process.stderr.write(`[doc-watch] capture error: ${error.url} — ${error.error}\n`);
    }
    process.stderr.write(`[doc-watch] ${errors.length} capture error(s); baselines were not updated.\n`);
    process.exit(2);
  }

  // Do not replace any baseline until every source has been captured successfully.
  if (isInit || isUpdate) {
    for (const result of results) writeBaseline(result.source, result.snap);
  }

  if (isInit) {
    process.stderr.write('[doc-watch] baseline initialized.\n');
    process.exit(0);
  }
  if (isUpdate) {
    process.stderr.write('[doc-watch] baseline updated to current state.\n');
    process.exit(0);
  }
  const changed = results.some((r) => hasChanges(r.changes));
  process.exit(changed ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write(`[doc-watch] fatal: ${e.stack || e}\n`);
  process.exit(2);
});
