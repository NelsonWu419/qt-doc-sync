const test = require('node:test');
const assert = require('node:assert/strict');
const { normalize } = require('../src/normalizer');

test('normalizes text payload into markdown content', () => {
  const raw = { kind: 'text', payload: { text: '# 标题\n正文' } };
  const doc = { doc_token: 'doc_001', title: '测试文档', obj_type: 'doc' };

  const out = normalize(raw, doc);
  assert.equal(out.content, '# 标题\n正文');
  assert.equal(out.meta.title, '测试文档');
  assert.equal(out.meta.obj_type, 'doc');
});

test('falls back safely for sheet payload in text-only MVP', () => {
  const raw = {
    kind: 'sheet',
    payload: {
      columns: ['姓名', '部门'],
      rows: [['张三', '产品']],
    },
  };
  const doc = { doc_token: 'sheet_001', title: '成员表', obj_type: 'sheet' };

  const out = normalize(raw, doc);
  assert.deepEqual(out.schema, {});
  assert.equal(out.content, '');
  assert.equal(out.meta.title, '成员表');
});

test('falls back safely for bitable payload in text-only MVP', () => {
  const raw = {
    kind: 'bitable',
    payload: {
      schema: { fields: ['任务', '状态'] },
      records: [{ 任务: '设计', 状态: '完成' }],
    },
  };
  const doc = { doc_token: 'bitable_001', title: '任务库', obj_type: 'bitable' };

  const out = normalize(raw, doc);
  assert.deepEqual(out.schema, {});
  assert.equal(out.content, '');
  assert.equal(out.meta.obj_type, 'bitable');
});

test('handles empty payload safely', () => {
  const raw = { kind: 'text', payload: {} };
  const doc = { doc_token: 'doc_002', title: '空文档', obj_type: 'doc' };

  const out = normalize(raw, doc);
  assert.equal(typeof out.content, 'string');
  assert.equal(out.meta.doc_token, 'doc_002');
});
