const test = require('node:test');
const assert = require('node:assert/strict');
const { mapSearchItemsToSourceItems, buildDocFetchRequest, classifyFeishuType } = require('../src/feishu-adapter');

test('maps feishu search items into source items', () => {
  const items = [{
    obj_token: 'doc_001',
    title: '测试文档',
    obj_type: 'DOCX',
    parent_token: 'folder_001',
    update_time: '2026-03-29T08:00:00+08:00',
  }];

  const out = mapSearchItemsToSourceItems(items);
  assert.equal(out.length, 1);
  assert.equal(out[0].obj_token, 'doc_001');
  assert.equal(out[0].obj_type, 'docx');
});

test('classifies feishu types to normalized types', () => {
  assert.equal(classifyFeishuType('DOC'), 'doc');
  assert.equal(classifyFeishuType('DOCX'), 'docx');
  assert.equal(classifyFeishuType('SHEET'), 'sheet');
  assert.equal(classifyFeishuType('BITABLE'), 'bitable');
  assert.equal(classifyFeishuType('WIKI'), 'wiki');
});

test('builds fetch request for text-like docs', () => {
  const out = buildDocFetchRequest({ doc_token: 'doc_001', obj_type: 'docx' });
  assert.deepEqual(out, { action: 'fetch_doc', doc_id: 'doc_001' });
});

test('builds fetch request for sheet docs', () => {
  const out = buildDocFetchRequest({ doc_token: 'sheet_001', obj_type: 'sheet' });
  assert.deepEqual(out, { action: 'fetch_sheet', spreadsheet_token: 'sheet_001' });
});

test('builds fetch request for bitable docs', () => {
  const out = buildDocFetchRequest({ doc_token: 'bitable_001', obj_type: 'bitable' });
  assert.deepEqual(out, { action: 'fetch_bitable', app_token: 'bitable_001' });
});
