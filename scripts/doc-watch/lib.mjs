/**
 * doc-watch 共享库：抓取 + HTML 解析助手，被 check-updates.mjs 与 draft-with-openai.mjs 复用。
 * 仅依赖 Node 内置能力，无第三方依赖。
 */

import crypto from 'node:crypto';

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) doc-watch/1.0';

export const SOURCES = [
  {
    id: 'loomy',
    name: 'Loomy Docs',
    type: 'vitepress',
    origin: 'https://loomy.xunfei.cn',
    index: 'https://loomy.xunfei.cn/docs',
  },
  {
    id: 'astronclaw',
    name: 'AstronClaw 使用指南',
    type: 'single',
    origin: 'https://www.xfyun.cn',
    pages: [
      'https://www.xfyun.cn/doc/spark/Agent-AstronClaw%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.html',
    ],
  },
];

const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 30_000;

function fetchError(url, attempts, error) {
  const cause = error.cause;
  const details = [cause?.code, cause?.message].filter(Boolean).join(': ');
  return new Error(
    `Failed to fetch ${url} after ${attempts} attempt(s): ${error.message || error}${details ? ` (${details})` : ''}`,
    { cause: error }
  );
}

// 上游站点偶发 `fetch failed` / `terminated`，单次失败不应让整轮巡检报错：
// 网络错误、超时、429 与 5xx 按指数退避重试，其余 HTTP 错误直接抛出。
export async function fetchText(url) {
  let lastError;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (res.ok) return await res.text();
      const err = new Error(`HTTP ${res.status} for ${url}`);
      if (res.status !== 429 && res.status < 500) throw Object.assign(err, { fatal: true });
      lastError = err;
    } catch (e) {
      if (e.fatal) throw fetchError(url, attempt, e);
      lastError = e;
    }
    if (attempt < FETCH_ATTEMPTS) await new Promise((r) => setTimeout(r, 2000 * 2 ** (attempt - 1)));
  }
  throw fetchError(url, FETCH_ATTEMPTS, lastError);
}

export function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/[​-‍﻿]/g, ''); // zero-width chars (VitePress anchors)
}

export function stripTags(html) {
  return decodeEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

export function hash(s) {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}

export function absolutize(src, origin) {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('/')) return origin + src;
  return origin + '/' + src;
}

// Grab the main article region so we don't diff/draft against nav/footer chrome.
export function extractMain(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (main) return main[1];
  const vpdoc = html.match(/<div class="vp-doc[\s\S]*?<\/main>/i);
  if (vpdoc) return vpdoc[0];
  for (const re of [
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:doc-content|markdown-body|article|content-detail)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
  ]) {
    const m = html.match(re);
    if (m) return m[1];
  }
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1] : html;
}

export function extractHeadings(contentHtml) {
  const out = [];
  const re = /<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(contentHtml))) {
    const inner = m[2].replace(/<a\b[^>]*class="[^"]*header-anchor[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
    const text = stripTags(inner).trim();
    if (text) out.push(`h${m[1]}:${text}`);
  }
  return out;
}

export function extractImages(contentHtml, origin) {
  const out = new Set();
  const re = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(contentHtml))) {
    const src = absolutize(m[1], origin);
    if (/loomy-avatar\.png$/i.test(src)) continue; // skip ubiquitous logo chrome
    out.add(src);
  }
  return [...out];
}

// VitePress sidebar carries the full page list. Pull /docs/* hrefs.
export function extractSidebarLinks(html, origin, indexUrl) {
  const links = new Set();
  const re = /<a\b[^>]*class="[^"]*VPLink[^"]*"[^>]*href="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1];
    if (!href.startsWith('/docs')) continue;
    href = href.replace(/#.*$/, '').replace(/\/$/, '');
    links.add(absolutize(href, origin));
  }
  links.add(indexUrl.replace(/\/$/, ''));
  return [...links].sort();
}

export async function capturePage(url, origin) {
  const html = await fetchText(url);
  const titleM = html.match(/<title>([^<]*)<\/title>/i);
  const main = extractMain(html);
  const text = stripTags(main);
  return {
    url,
    title: titleM ? decodeEntities(titleM[1]).trim() : url,
    headings: extractHeadings(main),
    images: extractImages(main, origin),
    textHash: hash(text),
    textLen: text.length,
  };
}

export async function captureSource(src) {
  let pageUrls;
  if (src.type === 'vitepress') {
    const indexHtml = await fetchText(src.index);
    pageUrls = extractSidebarLinks(indexHtml, src.origin, src.index);
  } else {
    pageUrls = src.pages;
  }

  const pages = {};
  for (const url of pageUrls) {
    try {
      pages[url] = await capturePage(url, src.origin);
    } catch (e) {
      pages[url] = { url, error: String(e.message || e) };
    }
  }
  return { source: src.id, name: src.name, pageCount: Object.keys(pages).length, pages };
}
