function classifyAuthError(error) {
  const msg = String(error && error.message ? error.message : error).toLowerCase();
  if (msg.includes('unauthorized') || msg.includes('token missing')) {
    return { auth_status: 'missing', retryable: false };
  }
  if (msg.includes('expired')) {
    return { auth_status: 'expired', retryable: true };
  }
  if (msg.includes('scope') || msg.includes('forbidden') || msg.includes('permission')) {
    return { auth_status: 'insufficient_scope', retryable: false };
  }
  return { auth_status: 'blocked', retryable: false };
}

function buildPreflightPlan(types = []) {
  const normalized = [...new Set(types.map((t) => String(t).toLowerCase()))];
  const requiredTools = new Set(['feishu_search_doc_wiki']);

  if (normalized.some((t) => ['doc', 'docx', 'wiki', 'mindnote'].includes(t))) {
    requiredTools.add('feishu_fetch_doc');
  }

  return { requiredTools: [...requiredTools] };
}

function summarizePreflight(results = []) {
  const availableTools = results.filter((r) => r.ok).map((r) => r.tool);
  const blockedTools = results.filter((r) => !r.ok);

  let auth_status = 'ok';
  if (availableTools.length === 0 && blockedTools.length > 0) auth_status = 'blocked';
  else if (availableTools.length > 0 && blockedTools.length > 0) auth_status = 'partial';

  return {
    auth_status,
    availableTools,
    blockedTools,
  };
}

module.exports = {
  classifyAuthError,
  buildPreflightPlan,
  summarizePreflight,
};
