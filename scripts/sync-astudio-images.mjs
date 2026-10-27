#!/usr/bin/env node
// Capture article illustrations, excluding site navigation icons.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SOURCES, fetchText, extractMain, decodeEntities } from './doc-watch/lib.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestFile = path.join(root, 'docs/public/astudio/assets.json');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');

export function articleImages(html, page) {
  const images = [];
  for (const match of extractMain(html).matchAll(/<img\b[^>]*>/gi)) {
    const src = match[0].match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src) continue;
    const url = new URL(src, 'https://agent.xfyun.cn');
    if (url.origin !== 'https://agent.xfyun.cn' || !url.pathname.startsWith('/studio-guide/astudio-guide/')) continue;
    const filename = path.posix.basename(url.pathname);
    if (!/^[\w.-]+\.(png|jpe?g|webp|gif|svg)$/i.test(filename)) throw new Error(`Unsupported image: ${url}`);
    images.push({page, url: url.href, alt: decodeEntities(match[0].match(/\balt=["']([^"']*)["']/i)?.[1] || 'AStudio'), local: `/astudio/images/${filename}`});
  }
  return images;
}

async function download(url) {
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {signal: AbortSignal.timeout(30000)});
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      if (!res.headers.get('content-type')?.startsWith('image/')) throw new Error(`Not an image: ${url}`);
      const data = Buffer.from(await res.arrayBuffer());
      if (!data.length) throw new Error(`Empty image: ${url}`);
      return data;
    } catch (e) { error = e; }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  throw error;
}

async function main() {
  const write = process.argv.includes('--write');
  const old = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const source = SOURCES.find(s => s.id === 'astudio');
  const images = [];
  for (const url of source.pages) images.push(...articleImages(await fetchText(url), url.split('/studio-guide/')[1].replaceAll('/', '_')));
  if (!images.length) throw new Error('No AStudio article images discovered; refusing an empty manifest');
  const changes = [];
  const captured = new Map();
  for (let offset = 0; offset < images.length; offset += 4) {
    await Promise.all(images.slice(offset, offset + 4).map(async image => {
      const data = await download(image.url);
      const previous = old.images.find(i => i.url === image.url && i.page === image.page);
      image.altEn = previous?.altEn || 'Official AStudio screenshot';
      image.sha256 = sha(data);
      captured.set(image.local, data);
      const local = path.join(root, 'docs/public', image.local);
      if (!previous || previous.sha256 !== image.sha256 || previous.alt !== image.alt || !fs.existsSync(local) || sha(fs.readFileSync(local)) !== image.sha256) changes.push(`- ${image.page}: ${image.alt} — ${image.url}`);
    }));
  }
  for (const previous of old.images) if (!images.some(i => i.url === previous.url && i.page === previous.page)) changes.push(`- Removed from source: ${previous.url}`);
  // Do not modify the checkout until all articles and images have been captured.
  if (write) {
    for (const [local, data] of captured) { const dest = path.join(root, 'docs/public', local); fs.mkdirSync(path.dirname(dest), {recursive:true}); fs.writeFileSync(dest, data); }
    fs.writeFileSync(manifestFile, JSON.stringify({...old, checkedAt: new Date().toISOString().slice(0,10), images}, null, 2) + '\n');
  }
  const report = ['## AStudio official images', '', `Checked ${images.length} article images.`, '', ...(changes.length ? changes : ['No image changes.']), '', 'New or changed illustrations require review in both language versions.'].join('\n');
  const reportIndex = process.argv.indexOf('--report');
  if (reportIndex >= 0) fs.writeFileSync(process.argv[reportIndex+1], report+'\n');
  console.log(report);
  if (!write && changes.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error); process.exitCode = 2; });
