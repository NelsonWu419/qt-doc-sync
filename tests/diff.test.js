const test = require('node:test');
const assert = require('node:assert/strict');
const { diffPlan, computeContentHash } = require('../src/diff');

test('marks new doc as new', () => {
  const records = [
    {
      doc_token: 'doc_001',
      content_hash: 'a',
      schema_hash: 'b',
      source_update_time: '2026-03-29T08:00:00+08:00',
    },
  ];
  const manifest = { documents: {} };

  const out = diffPlan(records, manifest);
  assert.equal(out.length, 1);
  assert.equal(out[0].status, 'new');
});

test('skips unchanged doc', () => {
  const records = [
    {
      doc_token: 'doc_001',
      content_hash: 'a',
      schema_hash: 'b',
      source_update_time: '2026-03-29T08:00:00+08:00',
    },
  ];
  const manifest = {
    documents: {
      doc_001: {
        contentHash: 'a',
        schemaHash: 'b',
        sourceUpdateTime: '2026-03-29T08:00:00+08:00',
      },
    },
  };

  const out = diffPlan(records, manifest);
  assert.equal(out.length, 0);
});

test('marks changed content as updated', () => {
  const records = [
    {
      doc_token: 'doc_001',
      content_hash: 'x',
      schema_hash: 'b',
      source_update_time: '2026-03-29T08:00:00+08:00',
    },
  ];
  const manifest = {
    documents: {
      doc_001: {
        contentHash: 'a',
        schemaHash: 'b',
        sourceUpdateTime: '2026-03-29T08:00:00+08:00',
      },
    },
  };

  const out = diffPlan(records, manifest);
  assert.equal(out.length, 1);
  assert.equal(out[0].status, 'updated');
});

test('computes content hash when missing', () => {
  const hash = computeContentHash({ content: 'hello world' });
  assert.equal(hash.length, 64);
  const same = computeContentHash({ content: 'hello world' });
  assert.equal(hash, same);
});
