const test = require('node:test');
const assert = require('node:assert/strict');
const { createOpenClawRuntime } = require('../src/runtime-openclaw');

test('searchDocs maps feishu search results into source items', async () => {
  const runtime = createOpenClawRuntime({
    searchDocWiki: async () => ({
      items: [
        {
          obj_token: 'doc_001',
          title: '测试文档',
          obj_type: 'DOCX',
          parent_token: 'folder_001',
          update_time: '2026-03-29T08:00:00+08:00',
        },
      ],
    }),
  });

  const out = await runtime.searchDocs();
  assert.equal(out.length, 1);
  assert.equal(out[0].obj_token, 'doc_001');
  assert.equal(out[0].obj_type, 'docx');
});

test('searchDocs returns empty list when no items', async () => {
  const runtime = createOpenClawRuntime({
    searchDocWiki: async () => ({ items: [] }),
  });

  const out = await runtime.searchDocs();
  assert.deepEqual(out, []);
});

test('searchDocs filters out non-text types in text-only MVP', async () => {
  const runtime = createOpenClawRuntime({
    searchDocWiki: async () => ({
      items: [
        { obj_token: 'doc_001', title: '正文', obj_type: 'DOCX' },
        { obj_token: 'sheet_001', title: '表格', obj_type: 'SHEET' },
      ],
    }),
  });

  const out = await runtime.searchDocs();
  assert.equal(out.length, 1);
  assert.equal(out[0].obj_token, 'doc_001');
});

test('fetchDoc normalizes markdown field into content', async () => {
  const runtime = createOpenClawRuntime({
    fetchDoc: async () => ({ title: '测试文档', markdown: '# 标题\n正文' }),
  });

  const out = await runtime.fetchDoc('doc_001');
  assert.equal(out.title, '测试文档');
  assert.match(out.content, /正文/);
});
