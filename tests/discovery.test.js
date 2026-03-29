const test = require('node:test');
const assert = require('node:assert/strict');
const { discover } = require('../src/discovery');

test('maps source item into DocumentRecord', () => {
  const sourceItems = [
    {
      obj_token: 'doc_001',
      title: '测试文档',
      obj_type: 'doc',
      parent_token: 'folder_001',
      update_time: '2026-03-29T08:00:00+08:00',
    },
  ];

  const out = discover(sourceItems);

  assert.equal(out.length, 1);
  assert.equal(out[0].doc_token, 'doc_001');
  assert.equal(out[0].title, '测试文档');
  assert.equal(out[0].obj_type, 'doc');
});

test('fills missing title with doc_token', () => {
  const sourceItems = [
    {
      obj_token: 'doc_002',
      obj_type: 'sheet',
      parent_token: 'folder_001',
      update_time: '2026-03-29T08:00:00+08:00',
    },
  ];

  const out = discover(sourceItems);
  assert.equal(out[0].title, 'doc_002');
});

test('keeps unsupported type for later handling', () => {
  const sourceItems = [
    {
      obj_token: 'file_001',
      title: '附件',
      obj_type: 'file',
      update_time: '2026-03-29T08:00:00+08:00',
    },
  ];

  const out = discover(sourceItems);
  assert.equal(out[0].obj_type, 'file');
});
