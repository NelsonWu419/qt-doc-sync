const { mapSearchItemsToSourceItems } = require('../feishu-adapter');
const { logger } = require('../utils/logger');

function normalizeSearchResults(result) {
  // Support various nesting levels: result.items, result.results, result.data.items, etc.
  const data = result?.data || result;
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(result?.items)
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
    // For this specific environment, we use a simple console.log [TOOL_CALL] pattern
    // if searchDocWiki and fetchDoc aren't explicitly provided as functions.
    return new Promise((resolve) => {
      const callId = Math.random().toString(36).substring(7);
      const call = { tool, params, callId };
      
      logger.debug(`[Bridge] 发送工具调用: ${JSON.stringify(call)}`);
      process.stdout.write(`[TOOL_CALL] ${JSON.stringify(call)}\n`);
      
      let input = '';
      const onData = (chunk) => {
        const str = chunk.toString();
        logger.debug(`[Bridge] Stdin 收到片段: ${str}`);
        input += str;
        
        // Split by lines and try to find a valid JSON response with matching callId
        const lines = input.split('\n');
        // Keep the last partial line if any
        input = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const response = JSON.parse(line.trim());
            logger.debug(`[Bridge] 解析行: ${JSON.stringify(response)}`);

            // Support both flat response and { result: ... } or { data: ... }
            if (response.callId === callId) {
              process.stdin.removeListener('data', onData);
              const actualResult = response.result !== undefined ? response.result : (response.data !== undefined ? response.data : response);
              resolve(actualResult);
              return;
            } else {
              logger.debug(`[Bridge] 忽略无关 callId: ${response.callId || 'none'}`);
            }
          } catch (e) {
            logger.debug(`[Bridge] 忽略非 JSON 行: ${line.substring(0, 100)}...`);
          }
        }
      };
      process.stdin.on('data', onData);
      
      // Safety timeout for bridge response (2 minutes)
      setTimeout(() => {
        process.stdin.removeListener('data', onData);
        logger.warn(`工具调用超时 (${tool}): ${callId}`);
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
      logger.info('开始搜索文档...');
      let allItems = [];
      let pageToken = null;
      let hasMore = true;
      let pageCount = 0;

      while (hasMore) {
        pageCount++;
        // 将 page_size 降低到 20 以减少单次请求压力
        const params = { action: 'search', query: '', page_size: 20 };
        if (pageToken) {
          params.page_token = pageToken;
        }

        const result = deps.searchDocWiki 
          ? await deps.searchDocWiki(params)
          : await runTool('feishu_search_doc_wiki', params);
        
        if (result === null) {
          logger.error('搜索工具返回 null (超时)。请检查：1. 飞书云文档权限是否已对当前机器人/用户开启；2. OpenClaw 平台工具响应是否正常。');
          break; 
        }

        const data = result?.data || result;
        const items = normalizeSearchResults(result);
        allItems = allItems.concat(items);
        
        pageToken = data?.page_token || data?.next_page_token;
        hasMore = data?.has_more === true && !!pageToken;

        logger.info(`第 ${pageCount} 页搜索完成, 抓取到 ${items.length} 个项目, hasMore=${hasMore}`);
        
        if (pageCount >= 100) break;
      }
        
      logger.info(`搜索结束，总计抓取到项目数量: ${allItems.length}`);
      
      const mapped = mapSearchItemsToSourceItems(allItems);
      logger.info(`映射后项目数量: ${mapped.length}`);

      const filtered = mapped.filter((item) => {
        const type = String(item.obj_type || '').toLowerCase();
        const ok = ['doc', 'docx', 'wiki', 'mindnote'].includes(type);
        if (!ok) {
          logger.info(`过滤掉非文本类型: ${item.title} (${item.obj_type})`);
        }
        return ok;
      });
      
      logger.info(`最终有效文档数量: ${filtered.length}`);
      return filtered;
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
