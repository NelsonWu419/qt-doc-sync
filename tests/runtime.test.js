const test = require('node:test');
const assert = require('node:assert/strict');
const { createMockRuntime } = require('../src/runtime');

test('mock runtime returns configured search results', async () => {
  const runtime = createMockRuntime({
    searchResults: [{ obj_token: 'doc_001', title: '测试', obj_type: 'DOCX' }],
  });

  const out = await runtime.searchDocs();
  assert.equal(out.length, 1);
  assert.equal(out[0].obj_token, 'doc_001');
});

test('mock runtime returns configured text fetch result', async () => {
  const runtime = createMockRuntime({
    textDocs: { doc_001: { title: '测试', content: '# 标题\n正文' } },
  });

  const out = await runtime.fetchDoc('doc_001');
  assert.equal(out.title, '测试');
  assert.match(out.content, /正文/);
});

test('mock runtime preflight marks available tools', async () => {
  const runtime = createMockRuntime({
    availableTools: ['feishu_search_doc_wiki', 'feishu_fetch_doc'],
  });

  const out = await runtime.checkTools(['feishu_search_doc_wiki', 'feishu_sheet']);
  assert.equal(out[0].ok, true);
  assert.equal(out[1].ok, false);
});
