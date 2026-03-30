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

  // Helper to call a tool via the OpenClaw [TOOL_CALL] bridge
  async function runTool(tool, params) {
    if (!process.stdin.isTTY && !deps.availableTools) {
       // In a non-interactive/automation context, we can try to use the bridge
       // However, to keep it simple for this MVP, we output the tool call
       // and expect the platform to handle the exchange.
    }
    
    // For this specific environment, we use a simple console.log [TOOL_CALL] pattern
    // if searchDocWiki and fetchDoc aren't explicitly provided as functions.
    return new Promise((resolve) => {
      const callId = Math.random().toString(36).substring(7);
      const call = { tool, params, callId };
      process.stdout.write(`[TOOL_CALL] ${JSON.stringify(call)}\n`);
      
      let input = '';
      const onData = (chunk) => {
        input += chunk.toString();
        if (input.includes('\n')) {
          try {
            const response = JSON.parse(input.trim());
            if (response.callId === callId) {
              process.stdin.removeListener('data', onData);
              resolve(response.result || response.data || response);
            }
          } catch (e) {
            // Wait for more data or handle parse error
          }
        }
      };
      process.stdin.on('data', onData);
      
      // Safety timeout for bridge response
      setTimeout(() => {
        process.stdin.removeListener('data', onData);
        resolve(null);
      }, 120000);
    });
  }

  return {
    async checkTools(tools = []) {
      return tools.map((tool) => ({
        tool,
        ok: availableTools.has(tool),
        auth_status: availableTools.has(tool) ? 'ok' : 'missing',
      }));
    },

    async searchDocs() {
      const result = deps.searchDocWiki 
        ? await deps.searchDocWiki({ action: 'search' })
        : await runTool('feishu_search_doc_wiki', { action: 'search', page_size: 50 });
        
      const items = normalizeSearchResults(result);
      return mapSearchItemsToSourceItems(items).filter((item) =>
        ['doc', 'docx', 'wiki', 'mindnote'].includes(String(item.obj_type || '').toLowerCase())
      );
    },

    async fetchDoc(docId) {
      const result = deps.fetchDoc
        ? await deps.fetchDoc(docId)
        : await runTool('feishu_fetch_doc', { doc_id: docId });
        
      return {
        title: result?.title || docId,
        content: result?.content || result?.markdown || result?.text || '',
      };
    },
  };
}

module.exports = { createOpenClawRuntime };
