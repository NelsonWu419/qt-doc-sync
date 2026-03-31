const { computeContentHash, stableStringify } = require('../utils/hash');
const { logger } = require('../utils/logger');

function diffPlan(records, manifest) {
  const docs = (manifest && manifest.documents) || {};
  logger.info(`比较 ${records.length} 条记录与 manifest (${Object.keys(docs).length} 条)...`);

  const results = records
    .map((r) => {
      const normalizedContentHash = r.content_hash || computeContentHash(r.content ?? r.payload?.text ?? r.normalized_content ?? r);
      const prev = docs[r.doc_token];
      if (!prev) return { ...r, content_hash: normalizedContentHash, status: 'new' };

      const changed =
        prev.contentHash !== normalizedContentHash ||
        prev.schemaHash !== r.schema_hash;

      if (!changed) return { ...r, content_hash: normalizedContentHash, status: 'unchanged' };
      return { ...r, content_hash: normalizedContentHash, status: 'updated' };
    });

  const changed = results.filter((r) => r.status !== 'unchanged');
  logger.info(`变更状态: 新增=${results.filter(r => r.status === 'new').length}, 更新=${results.filter(r => r.status === 'updated').length}, 未变=${results.filter(r => r.status === 'unchanged').length}`);
  return changed;
}

module.exports = { diffPlan, computeContentHash, stableStringify };
