const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSummary, formatSummary } = require('../src/reporter');

test('builds summary object', () => {
  const summary = buildSummary(
    { discovered: 10, queued: 4, archived: 3, failed: 1, unchanged: 6, rateLimited: 2 },
    { written: true, count: 2 }
  );

  assert.equal(summary.discovered, 10);
  assert.equal(summary.archived, 3);
  assert.equal(summary.failed, 1);
  assert.equal(summary.memoryWritten, 2);
  assert.equal(summary.memoryStatus, 'written');
});

test('formats summary text', () => {
  const text = formatSummary({
    discovered: 1,
    queued: 1,
    archived: 1,
    updated: 0,
    unchanged: 0,
    failed: 0,
    rateLimited: 0,
    memoryWritten: 1,
    memoryStatus: 'written',
  });

  assert.match(text, /qt-doc-sync summary/);
  assert.match(text, /archived=1/);
  assert.match(text, /memoryWritten=1/);
});
