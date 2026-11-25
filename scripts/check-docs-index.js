const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const docsDir = path.join(__dirname, '../docs');
const sourceIndex = JSON.parse(fs.readFileSync(path.join(docsDir, 'public/docs-index.json'), 'utf8'));
const publishedIndex = JSON.parse(fs.readFileSync(path.join(docsDir, '.vitepress/dist/docs-index.json'), 'utf8'));

assert.ok(Array.isArray(publishedIndex), 'The published documentation index must be an array');
assert.deepEqual(publishedIndex, sourceIndex, 'The site must publish the current generated index');

const languages = new Set();
for (const [index, entry] of publishedIndex.entries()) {
  assert.ok(entry && typeof entry === 'object', `Index entry ${index} must be an object`);
  assert.ok(['zh', 'en'].includes(entry.lang), `Index entry ${index} has an unsupported language`);
  assert.ok(typeof entry.heading === 'string' && entry.heading.trim(), `Index entry ${index} is missing a heading`);
  assert.ok(typeof entry.content === 'string' && entry.content.trim(), `Index entry ${index} is missing content`);
  languages.add(entry.lang);
}

assert.deepEqual([...languages].sort(), ['en', 'zh'], 'The index must contain both English and Chinese content');
console.log(`Validated ${publishedIndex.length} published documentation index entries in both languages.`);
