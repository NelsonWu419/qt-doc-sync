const crypto = require('crypto');

function stableStringify(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

function computeContentHash(record) {
  const seed =
    record.content_hash ??
    record.content ??
    record.content_md ??
    record.contentText ??
    record.normalized_content ??
    record.payload?.text ??
    stableStringify(record.payload ?? record);

  return crypto.createHash('sha256').update(String(seed)).digest('hex');
}

function diffPlan(records, manifest) {
  const docs = (manifest && manifest.documents) || {};

  return records
    .map((r) => {
      const normalizedContentHash = r.content_hash || computeContentHash(r);
      const prev = docs[r.doc_token];
      if (!prev) return { ...r, content_hash: normalizedContentHash, status: 'new' };

      const changed =
        prev.contentHash !== normalizedContentHash ||
        prev.schemaHash !== r.schema_hash ||
        prev.sourceUpdateTime !== r.source_update_time;

      if (!changed) return { ...r, content_hash: normalizedContentHash, status: 'unchanged' };
      return { ...r, content_hash: normalizedContentHash, status: 'updated' };
    })
    .filter((r) => r.status !== 'unchanged');
}

module.exports = { diffPlan, computeContentHash, stableStringify };
