const { mapSearchItemsToSourceItems } = require('../feishu-adapter');

function normalizeSearchResults(result) {
  const items = Array.isArray(result?.items)
    ? result.items
    : Array.isArray(result?.results)
      ? result.results
      : [];

  return items.map((item) => item?.result_meta ? { ...item.result_meta, title: item.title_highlighted || item.title } : item);
}

function createOpenClawRuntime(deps = {}) {
  const searchDocWiki = deps.searchDocWiki || (async () => ({ items: [] }));
  const fetchDocFn = deps.fetchDoc || (async (docId) => ({ title: docId, content: '' }));
  const availableTools = new Set(deps.availableTools || ['feishu_search_doc_wiki', 'feishu_fetch_doc']);

  return {
    async checkTools(tools = []) {
      return tools.map((tool) => ({
        tool,
        ok: availableTools.has(tool),
        auth_status: availableTools.has(tool) ? 'ok' : 'missing',
      }));
    },

    async searchDocs() {
      const result = await searchDocWiki({ action: 'search' });
      const items = normalizeSearchResults(result);
      return mapSearchItemsToSourceItems(items).filter((item) =>
        ['doc', 'docx', 'wiki', 'mindnote'].includes(String(item.obj_type || '').toLowerCase())
      );
    },

    async fetchDoc(docId) {
      const result = await fetchDocFn(docId);
      return {
        title: result?.title || docId,
        content: result?.content || result?.markdown || result?.text || '',
      };
    },
  };
}

module.exports = { createOpenClawRuntime };
