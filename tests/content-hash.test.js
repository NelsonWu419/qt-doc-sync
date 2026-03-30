const test = require('node:test');
const assert = require('node:assert/strict');
const { diffPlan } = require('../src/diff');
const {
  computeContentHash,
  computeSchemaHash,
  computeDocumentHashes,
} = require('../src/utils/hash');

test('同内容同 hash', () => {
  const left = computeDocumentHashes({ content: 'hello world', schema: { a: 1, b: 2 } });
  const right = computeDocumentHashes({ content: 'hello world', schema: { b: 2, a: 1 } });

  assert.equal(left.contentHash, right.contentHash);
  assert.equal(left.schemaHash, right.schemaHash);
});

test('空白差异不触发更新（\n vs \r\n）', () => {
  const left = computeContentHash('第一行\n第二行\n');
  const right = computeContentHash('第一行\r\n第二行\r\n');

  assert.equal(left, right);
});

test('正文变化触发更新', () => {
  const manifest = {
    documents: {
      doc_001: {
        contentHash: computeContentHash('原文'),
        schemaHash: computeSchemaHash({ blocks: 1 }),
        sourceUpdateTime: '2026-03-30T08:00:00+08:00',
      },
    },
  };

  const records = [
    {
      doc_token: 'doc_001',
      content_hash: computeContentHash('新文'),
      schema_hash: computeSchemaHash({ blocks: 1 }),
      source_update_time: '2026-03-30T08:10:00+08:00',
    },
  ];

  const out = diffPlan(records, manifest);
  assert.equal(out.length, 1);
  assert.equal(out[0].status, 'updated');
});

test('schema 变化触发更新', () => {
  const manifest = {
    documents: {
      doc_002: {
        contentHash: computeContentHash('正文不变'),
        schemaHash: computeSchemaHash({ blocks: 1 }),
        sourceUpdateTime: '2026-03-30T08:00:00+08:00',
      },
    },
  };

  const records = [
    {
      doc_token: 'doc_002',
      content_hash: computeContentHash('正文不变'),
      schema_hash: computeSchemaHash({ blocks: 2 }),
      source_update_time: '2026-03-30T08:10:00+08:00',
    },
  ];

  const out = diffPlan(records, manifest);
  assert.equal(out.length, 1);
  assert.equal(out[0].status, 'updated');
});

test('时间变内容不变 → 跳过', () => {
  const manifest = {
    documents: {
      doc_003: {
        contentHash: computeContentHash('内容稳定'),
        schemaHash: computeSchemaHash({ blocks: 1 }),
        sourceUpdateTime: '2026-03-30T08:00:00+08:00',
      },
    },
  };

  const records = [
    {
      doc_token: 'doc_003',
      content_hash: computeContentHash('内容稳定'),
      schema_hash: computeSchemaHash({ blocks: 1 }),
      source_update_time: '2026-03-30T12:00:00+08:00',
    },
  ];

  const out = diffPlan(records, manifest);
  assert.equal(out.length, 0);
});
