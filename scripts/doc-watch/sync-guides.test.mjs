import assert from 'node:assert/strict';
import test from 'node:test';
import {section} from './sync-guides.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash, stripTags, extractMain} from './lib.mjs';

test('refreshing one source preserves hand-written text and other source updates', () => {
  const original = '# FAQ\n\nManual advice.\n';
  const both = section(section(original,'terms','Old terms'),'privacy','Privacy changes');
  const next = section(both,'terms','New terms');
  assert.ok(next.includes('Manual advice.'));
  assert.ok(next.includes('Privacy changes'));
  assert.ok(next.includes('New terms'));
  assert.ok(!next.includes('Old terms'));
  assert.equal(section(next,'terms','New terms'),next);
  assert.throws(()=>section('<!-- doc-watch:terms -->','terms','update'), /Incomplete/);
});

test('changed agreement updates both FAQs from the captured article and rejects source drift', t => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(),'doc-watch-sync-'));
  t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(cwd,file)),{recursive:true});
    fs.writeFileSync(path.join(cwd,file),value);
  };
  const git = (...args)=>execFileSync('git',args,{cwd,stdio:'pipe'});
  git('init');
  const url='https://loomy.xunfei.cn/docs/Safe/Loomy-user';
  const html='<main><h1>授权接入</h1><p>通过官网使用服务。</p></main>';
  const digest=hash(stripTags(extractMain(html)));
  write('docs/public/astudio/assets.json','{"images":[]}');
  git('add','docs');
  git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');
  const files=['docs/guide/loomy/faq.md','docs/en/guide/loomy/faq.md'];
  files.forEach(file=>write(file,'# FAQ\n\nManual advice.\n'));
  const snapshot=textHash=>JSON.stringify({pages:{[url]:{textHash,images:[]}}});
  write('scripts/doc-watch/baseline/loomy.json',snapshot(digest));
  write('changes.json',JSON.stringify([{source:'loomy',changes:{newPages:[],removedPages:[],changedPages:[{url}]}}]));
  const output={zh:['官网接入'],en:['Use the official website.'],captions:[]};
  const response={status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]};
  write('fixture.mjs','globalThis.fetch=async url=>url.includes("api.openai.com")?Response.json('+JSON.stringify(response)+'):new Response('+JSON.stringify(html)+');');
  const script=fileURLToPath(new URL('./sync-guides.mjs',import.meta.url));
  const run=()=>execFileSync(process.execPath,['--import','./fixture.mjs',script,'changes.json'],{cwd,env:{...process.env,OPENAI_API_KEY:'fixture'},stdio:'pipe'});
  run();
  const read=file=>fs.readFileSync(path.join(cwd,file),'utf8');
  assert.match(read(files[0]),/官网接入/);
  assert.match(read(files[1]),/Use the official website/);
  const previous=files.map(read);
  run();
  assert.deepEqual(files.map(read),previous);
  write('scripts/doc-watch/baseline/loomy.json',snapshot('stale'));
  assert.throws(run,/Source changed during drafting/);
  assert.deepEqual(files.map(read),previous);
});
