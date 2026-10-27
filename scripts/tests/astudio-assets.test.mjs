import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {articleImages} from '../sync-astudio-images.mjs';

const manifest = JSON.parse(fs.readFileSync(new URL('../../docs/public/astudio/assets.json', import.meta.url), 'utf8'));
test('all official illustrations are local, intact and included in both languages', () => {
  assert.equal(manifest.images.length, 56);
  for (const image of manifest.images) {
    const data = fs.readFileSync(new URL('../../docs/public'+image.local, import.meta.url));
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'), image.sha256, image.local);
    assert.ok(image.altEn && !/[\u4e00-\u9fff]/.test(image.altEn), image.local);
    for (const locale of ['', 'en/']) {
      const markdown = fs.readFileSync(new URL(`../../docs/${locale}guide/astudio/${image.page}.md`, import.meta.url), 'utf8');
      assert.ok(markdown.includes(image.local), `${locale}${image.page}: ${image.local}`);
    }
  }
});
test('source extraction excludes navigation and outside hosts', () => {
  const html = '<nav><img src="/studio-guide/astudio-guide/outside.png"></nav><main><img alt="Workspace" src="/studio-guide/astudio-guide/workspace.png"><img src="/studio-guide/paper/arrow.svg"><img src="https://other.example/studio-guide/astudio-guide/a.png"></main>';
  const images = articleImages(html, 'quickstart');
  assert.equal(images.length, 1);
  assert.equal(images[0].alt, 'Workspace');
  assert.equal(images[0].local, '/astudio/images/workspace.png');
});
