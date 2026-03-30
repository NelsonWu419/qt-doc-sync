const fs = require('fs');
const path = require('path');

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function writeHistorySnapshot(historyDir, doc, normalized, raw) {
  const snapshotName = `${stamp()}.json`;
  const snapshotPath = path.join(historyDir, snapshotName);
  const snapshot = {
    capturedAt: new Date().toISOString(),
    doc_token: doc.doc_token,
    title: doc.title,
    obj_type: doc.obj_type,
    source_update_time: doc.source_update_time || null,
    content_hash: doc.content_hash || null,
    schema_hash: doc.schema_hash || null,
    raw,
    normalized,
  };
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  return snapshotPath;
}

function archiveOne(baseDir, doc, normalized, raw, options = {}) {
  const rawDir = path.join(baseDir, 'raw', doc.doc_token);
  const normalizedDir = path.join(baseDir, 'normalized', doc.doc_token);
  const historyDir = path.join(baseDir, 'history', doc.doc_token);
  const manifestPath = path.join(baseDir, 'manifest.json');

  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });
  fs.mkdirSync(historyDir, { recursive: true });

  fs.writeFileSync(path.join(rawDir, 'payload.json'), JSON.stringify(raw, null, 2));
  fs.writeFileSync(path.join(normalizedDir, 'content.md'), normalized.content || '');
  fs.writeFileSync(
    path.join(normalizedDir, 'schema.json'),
    JSON.stringify(normalized.schema || {}, null, 2)
  );
  fs.writeFileSync(
    path.join(normalizedDir, 'meta.json'),
    JSON.stringify(normalized.meta || {}, null, 2)
  );

  const historyPath = writeHistorySnapshot(historyDir, doc, normalized, raw);
  const manifest = options.manifest || { documents: {}, checkpoint: null, runs: [] };
  manifest.documents = manifest.documents || {};
  manifest.documents[doc.doc_token] = {
    title: doc.title,
    obj_type: doc.obj_type,
    status: 'archived',
    archivedAt: new Date().toISOString(),
    contentHash: doc.content_hash || null,
    schemaHash: doc.schema_hash || null,
    sourceUpdateTime: doc.source_update_time || null,
    historyPath,
  };
  manifest.checkpoint = {
    doc_token: doc.doc_token,
    archivedAt: new Date().toISOString(),
    historyPath,
  };
  // manifest saving is now handled by the caller to avoid double writes
  // and support periodic saves during batch runs.

  return { rawDir, normalizedDir, historyDir, historyPath, manifestPath };
}

module.exports = { archiveOne, writeHistorySnapshot };
