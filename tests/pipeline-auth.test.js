const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const QtDocArchive = require('../scripts/sync-archive');
const { createMockRuntime } = require('../src/runtime');

test('pipeline stops when auth is fully blocked', async () => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qt-doc-sync-auth-'));
  const runtime = createMockRuntime({
    availableTools: [],
    searchResults: [],
  });

  const app = new QtDocArchive([], { runtime, targetDirectory: baseDir });
  const out = await app.run();

  assert.equal(out.authStatus, 'blocked');
  assert.equal(out.archived, 0);
});

test('pipeline runs when required text tools are available', async () => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qt-doc-sync-auth-ok-'));
  const runtime = createMockRuntime({
    availableTools: ['feishu_search_doc_wiki', 'feishu_fetch_doc'],
    searchResults: [{ obj_token: 'doc_001', title: '测试', obj_type: 'DOCX', update_time: '2026-03-29T08:00:00+08:00' }],
    textDocs: { doc_001: { title: '测试', content: '# 标题\n正文' } },
  });

  const app = new QtDocArchive([], { runtime, targetDirectory: baseDir });
  const out = await app.run();

  assert.equal(out.authStatus, 'ok');
  assert.equal(out.archived, 1);
});
