const test = require('node:test');
const assert = require('node:assert/strict');
const { memorySync } = require('../src/memory-sync');

test('does not write when archive failed', () => {
  const out = memorySync(
    { items: [{ type: 'decision', title: 'A', summary: 'B' }] },
    { status: 'error' }
  );

  assert.equal(out.written, false);
  assert.equal(out.count, 0);
});

test('writes decision item', () => {
  const out = memorySync(
    { items: [{ type: 'decision', title: '弃用旧 skill', summary: '迁移到 qt-doc-sync' }] },
    { status: 'archived' }
  );

  assert.equal(out.written, true);
  assert.equal(out.count, 1);
});

test('filters duplicate item', () => {
  const out = memorySync(
    { items: [{ type: 'decision', title: '弃用旧 skill', summary: '迁移到 qt-doc-sync' }] },
    { status: 'archived' },
    [{ title: '弃用旧 skill', summary: '迁移到 qt-doc-sync' }]
  );

  assert.equal(out.written, false);
  assert.equal(out.count, 0);
});
