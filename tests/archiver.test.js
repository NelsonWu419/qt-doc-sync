const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { archiveOne } = require('../src/archiver');

test('writes raw, normalized and history files', () => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qt-doc-sync-'));
  const doc = { doc_token: 'doc_001', title: '测试文档', obj_type: 'doc', content_hash: 'abc' };
  const normalized = {
    content: '# 标题\n正文',
    schema: {},
    meta: { title: '测试文档', obj_type: 'doc' },
  };
  const raw = { text: 'hello' };

  const out = archiveOne(baseDir, doc, normalized, raw);

  assert.equal(fs.existsSync(path.join(out.rawDir, 'payload.json')), true);
  assert.equal(fs.existsSync(path.join(out.normalizedDir, 'content.md')), true);
  assert.equal(fs.existsSync(path.join(out.normalizedDir, 'schema.json')), true);
  assert.equal(fs.existsSync(path.join(out.normalizedDir, 'meta.json')), true);
  assert.equal(fs.existsSync(out.historyPath), true);
  assert.equal(fs.existsSync(out.manifestPath), true);

  const manifest = JSON.parse(fs.readFileSync(out.manifestPath, 'utf8'));
  assert.equal(manifest.checkpoint.doc_token, 'doc_001');
  assert.equal(manifest.documents.doc_001.historyPath, out.historyPath);
});
