const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchByType } = require('../src/fetcher');

test('dispatches doc to text fetch', async () => {
  const out = await fetchByType({ doc_token: 'doc_001', obj_type: 'doc' });
  assert.equal(out.kind, 'text');
  assert.equal(out.status, 'ok');
});

test('dispatches wiki to text fetch', async () => {
  const out = await fetchByType({ doc_token: 'wiki_001', obj_type: 'wiki' });
  assert.equal(out.kind, 'text');
  assert.equal(out.status, 'ok');
});

test('stops sheet path in text-only MVP', async () => {
  const out = await fetchByType({ doc_token: 'sheet_001', obj_type: 'sheet' });
  assert.equal(out.kind, 'unsupported');
  assert.equal(out.status, 'unsupported');
});

test('stops bitable path in text-only MVP', async () => {
  const out = await fetchByType({ doc_token: 'bitable_001', obj_type: 'bitable' });
  assert.equal(out.kind, 'unsupported');
  assert.equal(out.status, 'unsupported');
});

test('returns unsupported for unknown type', async () => {
  const out = await fetchByType({ doc_token: 'file_001', obj_type: 'file' });
  assert.equal(out.status, 'unsupported');
});
