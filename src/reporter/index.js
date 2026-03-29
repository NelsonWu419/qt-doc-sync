function buildSummary(stats = {}, memory = {}, extra = {}) {
  return {
    discovered: stats.discovered || 0,
    queued: stats.queued || 0,
    archived: stats.archived || 0,
    updated: stats.updated || 0,
    unchanged: stats.unchanged || 0,
    failed: stats.failed || 0,
    rateLimited: stats.rateLimited || 0,
    memoryWritten: memory.count || 0,
    memoryStatus: memory.written ? 'written' : 'skipped',
    authStatus: extra.authStatus || 'ok',
  };
}

function formatSummary(summary) {
  return [
    'qt-doc-sync summary',
    `discovered=${summary.discovered}`,
    `queued=${summary.queued}`,
    `archived=${summary.archived}`,
    `updated=${summary.updated}`,
    `unchanged=${summary.unchanged}`,
    `failed=${summary.failed}`,
    `rateLimited=${summary.rateLimited}`,
    `memoryWritten=${summary.memoryWritten}`,
    `memoryStatus=${summary.memoryStatus}`,
    `authStatus=${summary.authStatus}`,
  ].join('\n');
}

module.exports = { buildSummary, formatSummary };
