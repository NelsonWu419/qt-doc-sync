const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { discover } = require('../src/discovery');
const { diffPlan } = require('../src/diff');
const { fetchByType } = require('../src/fetcher');
const { normalize } = require('../src/normalizer');
const { archiveOne } = require('../src/archiver');
const { memorySync } = require('../src/memory-sync');
const { buildSummary } = require('../src/reporter');

test('runs minimal archive pipeline end-to-end', async () => {
  const sourceItems = [{
    obj_token: 'doc_001',
    title: '测试文档',
    obj_type: 'doc',
    parent_token: 'folder_001',
    update_time: '2026-03-29T08:00:00+08:00',
  }];

  const records = discover(sourceItems);
  const queue = diffPlan(records.map((r) => ({ ...r, content_hash: 'a', schema_hash: 'b' })), { documents: {} });
  assert.equal(queue.length, 1);

  const fetched = await fetchByType(queue[0]);
  const normalized = normalize(fetched, queue[0]);

  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qt-doc-sync-int-'));
  const archived = archiveOne(baseDir, queue[0], normalized, fetched.payload);
  assert.equal(fs.existsSync(archived.manifestPath), true);

  const mem = memorySync(
    { items: [{ type: 'decision', title: '采用 qt-doc-sync', summary: '用于单向归档' }] },
    { status: 'archived' },
    []
  );
  assert.equal(mem.written, true);

  const summary = buildSummary({ discovered: 1, queued: 1, archived: 1 }, mem);
  assert.equal(summary.archived, 1);
  assert.equal(summary.memoryWritten, 1);
});
