function isLongTermUseful(item) {
  return (
    item.type === 'decision' ||
    item.type === 'rule' ||
    item.type === 'risk' ||
    item.type === 'preference' ||
    item.type === 'task'
  );
}

function memorySync(normalizedPayload, archiveResult, existingMemory = []) {
  if (archiveResult.status !== 'archived') {
    return { written: false, count: 0, items: [] };
  }

  const candidates = normalizedPayload.items || [];
  const written = [];

  for (const item of candidates) {
    if (!isLongTermUseful(item)) continue;

    const dup = existingMemory.some(
      (m) => m.title === item.title || m.summary === item.summary
    );
    if (dup) continue;

    written.push({
      type: item.type,
      title: item.title,
      summary: item.summary,
    });
  }

  return {
    written: written.length > 0,
    count: written.length,
    items: written,
  };
}

module.exports = { memorySync, isLongTermUseful };
