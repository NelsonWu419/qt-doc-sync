const { execSync } = require('child_process');
const { logger } = require('../utils/logger');
const { mapSearchItemsToSourceItems } = require('../feishu-adapter');

function createFeishuCLIRuntime(deps = {}) {
  const exec = deps.execSync || execSync;

  return {
    async checkTools(tools = []) {
      return tools.map(tool => {
        try {
          exec(`which ${tool}`, { stdio: 'ignore' });
          return { tool, ok: true, auth_status: 'ok' };
        } catch {
          return { tool, ok: false, auth_status: 'missing' };
        }
      });
    },
    async searchDocs() {
      logger.info('开始在 CLI 环境中搜索文档...');
      let allItems = [];
      let pageToken = '';
      let hasMore = true;
      let pageCount = 0;

      while (hasMore) {
        pageCount++;
        try {
          const cmd = `feishu api get /open-apis/suite/docs-api/search/object?page_size=20${pageToken ? '&page_token=' + pageToken : ''}`;
          const stdout = exec(cmd, { encoding: 'utf8', stdio: 'pipe' }).toString();
          const result = JSON.parse(stdout);
          
          const data = result.data || result;
          const items = Array.isArray(data.items) ? data.items : [];
          allItems = allItems.concat(items);
          
          pageToken = data.page_token || '';
          hasMore = data.has_more && !!pageToken;

          if (pageCount >= 100) break;
        } catch (e) {
          logger.error(`CLI searchDocs error: ${e.message}`);
          break;
        }
      }
      
      const mapped = mapSearchItemsToSourceItems(allItems);
      return mapped.filter((item) => {
        const type = String(item.obj_type || '').toLowerCase();
        return ['doc', 'docx', 'wiki', 'mindnote'].includes(type);
      });
    },
    async fetchDoc(docId) {
      try {
        const cmd = `feishu api get /open-apis/docx/v1/documents/${docId}/raw_content`;
        const stdout = exec(cmd, { encoding: 'utf8', stdio: 'pipe' }).toString();
        const result = JSON.parse(stdout);
        const data = result.data || result;
        return {
          title: docId,
          content: data.content || ''
        };
      } catch (e) {
        logger.error(`CLI fetchDoc error for ${docId}: ${e.message}`);
        return { title: docId, content: '' };
      }
    }
  };
}

module.exports = { createFeishuCLIRuntime };
