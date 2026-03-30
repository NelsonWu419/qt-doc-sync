const { computeContentHash, stableStringify } = require('../utils/hash');

function diffPlan(records, manifest) {
  const docs = (manifest && manifest.documents) || {};

  return records
    .map((r) => {
      const normalizedContentHash = r.content_hash || computeContentHash(r.content ?? r.payload?.text ?? r.normalized_content ?? r);
      const prev = docs[r.doc_token];
      if (!prev) return { ...r, content_hash: normalizedContentHash, status: 'new' };

      const changed =
        prev.contentHash !== normalizedContentHash ||
        prev.schemaHash !== r.schema_hash;

      if (!changed) return { ...r, content_hash: normalizedContentHash, status: 'unchanged' };
      return { ...r, content_hash: normalizedContentHash, status: 'updated' };
    })
    .filter((r) => r.status !== 'unchanged');
}

module.exports = { diffPlan, computeContentHash, stableStringify };
