import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { SOURCES } from './lib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

test('AStudio covers all seven guides and eight agreements', () => {
  const source = SOURCES.find((s) => s.id === 'astudio');
  const slugs = source.pages.map((url) => new URL(url).pathname.replace('/studio-guide/', ''));
  assert.deepEqual(slugs, [
    'intro', 'quickstart', 'features', 'cases', 'tips', 'pricing', 'faq',
    'agreements/user-service-web', 'agreements/privacy-web',
    'agreements/user-service-client', 'agreements/privacy-client',
    'agreements/personal-information-collection-list-zh-CN',
    'agreements/third-party-sharing-list-zh-CN',
    'agreements/product-subscription-service', 'agreements/auto-renewal-service',
  ]);
});

test('AStudio body-only price changes are reported without changing headings', (t) => {
  const f = fixture(t);
  initialize(f);
  const result = f.run('studio-changed');
  assert.equal(result.status, 1, result.stderr);
  const studio = JSON.parse(result.stdout).find((s) => s.source === 'astudio');
  assert.equal(studio.changes.changedPages.length, 1);
  assert.match(studio.changes.changedPages[0].url, /\/pricing$/);
  assert.equal(studio.changes.changedPages[0].textChanged, true);
  assert.deepEqual(studio.changes.changedPages[0].newHeadings, []);
});

test('source-specific baseline acceptance leaves other sources untouched', (t) => {
  const f = fixture(t);
  initialize(f);
  const before = f.baselines();
  const result = f.run('studio-changed', ['--source', 'astudio', '--update']);
  assert.equal(result.status, 0, result.stderr);
  const after = f.baselines();
  assert.notEqual(after['astudio.json'], before['astudio.json']);
  assert.equal(after['loomy.json'], before['loomy.json']);
  assert.equal(after['astronclaw.json'], before['astronclaw.json']);
});

function fixture(t) {
  const tempRoot = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(tempRoot, 'doc-watch-test-'));
  t.after(() => {
    const resolved = fs.realpathSync(dir);
    assert.equal(path.dirname(resolved), tempRoot);
    assert.ok(path.basename(resolved).startsWith('doc-watch-test-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  for (const name of ['lib.mjs', 'check-updates.mjs']) {
    fs.copyFileSync(path.join(scriptDir, name), path.join(dir, name));
  }
  const preload = path.join(dir, 'preload.mjs');
  fs.writeFileSync(preload, `
import { SOURCES } from './lib.mjs';
const mode = process.env.DOC_WATCH_TEST_MODE || 'ok';
const loomy = SOURCES.find(s => s.id === 'loomy');
const astron = SOURCES.find(s => s.id === 'astronclaw');
const studio = SOURCES.find(s => s.id === 'astudio');
const index = loomy.index;
const guide = loomy.origin + '/docs/test-guide';
let discovered = false;
const originalTimeout = globalThis.setTimeout;
globalThis.setTimeout = (callback, _ms, ...args) => originalTimeout(callback, 0, ...args);
globalThis.fetch = async (url) => {
  if (url === index && !discovered) {
    if (mode === 'index-error') {
      throw new TypeError('fetch failed', { cause: Object.assign(new Error('fixture connection reset'), { code: 'ECONNRESET' }) });
    }
    discovered = true;
    return new Response('<a class="VPLink" href="/docs/test-guide">guide</a>', { status: 200 });
  }
  const failed = mode === 'all-errors'
    || (mode === 'page-error' && url === guide)
    || ((mode === 'second-error' || mode === 'changed-and-error') && url === astron.pages[0]);
  if (mode === 'studio-empty' && url === studio.pages[0]) return new Response('<main>Loading...</main>', {status:200});
  if (mode === 'studio-error' && url === studio.pages[0]) return new Response('unavailable', {status:404});
  if (failed) return new Response('fixture not found', { status: 404 });
  const changed = ((mode === 'changed' || mode === 'changed-and-error') && url === guide) || (mode === 'studio-changed' && url === studio.pages[5]);
  return new Response('<title>Fixture</title><main><h1>Guide</h1><p>' + (changed ? 'updated' : 'original') + ' body text'.repeat(20) + '</p></main>', { status: 200 });
};
`);
  return {
    dir,
    run(mode = 'ok', args = []) {
      const result = spawnSync(process.execPath, [
        '--import', pathToFileURL(preload).href,
        path.join(dir, 'check-updates.mjs'),
        '--json', '--report', path.join(dir, 'report.md'), ...args,
      ], {
        encoding: 'utf8', timeout: 10_000,
        env: { ...process.env, DOC_WATCH_TEST_MODE: mode },
      });
      assert.ifError(result.error);
      assert.equal(result.signal, null);
      return result;
    },
    baselines() {
      const base = path.join(dir, 'baseline');
      if (!fs.existsSync(base)) return {};
      return Object.fromEntries(fs.readdirSync(base).map((name) => [name, fs.readFileSync(path.join(base, name), 'utf8')]));
    },
    report() {
      return fs.readFileSync(path.join(dir, 'report.md'), 'utf8');
    },
  };
}

function initialize(f) {
  const result = f.run('ok', ['--init']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(Object.keys(f.baselines()).length, 3);
}

test('complete unchanged captures succeed without modifying either baseline', (t) => {
  const f = fixture(t);
  initialize(f);
  const before = f.baselines();
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(f.report(), /所有文档源均无新增内容/);
  assert.deepEqual(f.baselines(), before);
});

for (const mode of ['page-error', 'all-errors', 'changed-and-error']) {
  test(`${mode} exits with capture failure and never reports full success`, (t) => {
    const f = fixture(t);
    initialize(f);
    const before = f.baselines();
    const result = f.run(mode);
    assert.equal(result.status, 2, result.stderr);
    const results = JSON.parse(result.stdout);
    assert.ok(results.some((r) => r.changes.errors.length));
    if (mode === 'all-errors') {
      assert.equal(results.reduce((count, r) => count + r.changes.errors.length, 0), 18);
    }
    if (mode === 'changed-and-error') {
      assert.ok(results.some((r) => r.changes.changedPages.length));
    }
    assert.match(result.stderr, /HTTP 404/);
    assert.match(result.stderr, /baselines were not updated/);
    assert.match(f.report(), /抓取未完成/);
    assert.doesNotMatch(f.report(), /所有文档源均无新增内容/);
    assert.deepEqual(f.baselines(), before);
  });
}

for (const mode of ['page-error', 'second-error', 'changed-and-error', 'studio-error', 'studio-empty']) {
  test(`--update preserves both baselines on ${mode}`, (t) => {
    const f = fixture(t);
    initialize(f);
    const before = f.baselines();
    const result = f.run(mode, ['--update']);
    assert.equal(result.status, 2, result.stderr);
    assert.deepEqual(f.baselines(), before);
  });
}

test('--init does not create partial baselines when the second source fails', (t) => {
  const f = fixture(t);
  const result = f.run('second-error', ['--init']);
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(f.baselines(), {});
});

test('discovery failure preserves baselines and reports URL, attempts and cause', (t) => {
  const f = fixture(t);
  initialize(f);
  const before = f.baselines();
  const result = f.run('index-error', ['--update']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /https:\/\/loomy\.xunfei\.cn\/docs/);
  assert.match(result.stderr, /after 3 attempt\(s\)/);
  assert.match(result.stderr, /ECONNRESET: fixture connection reset/);
  assert.deepEqual(f.baselines(), before);
});

test('successful changes still exit 1 and --update accepts complete captures', (t) => {
  const f = fixture(t);
  initialize(f);
  const before = f.baselines();
  const changed = f.run('changed');
  assert.equal(changed.status, 1, changed.stderr);
  assert.deepEqual(f.baselines(), before);
  const updated = f.run('changed', ['--update']);
  assert.equal(updated.status, 0, updated.stderr);
  assert.notDeepEqual(f.baselines(), before);
  const unchanged = f.run('changed');
  assert.equal(unchanged.status, 0, unchanged.stderr);
});
