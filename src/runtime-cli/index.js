const { execSync } = require('child_process');
const { logger } = require('../utils/logger');
const { mapSearchItemsToSourceItems } = require('../feishu-adapter');

function createFeishuCLIRuntime(deps = {}) {
  const exec = deps.execSync || execSync;
  const binary = 'lark-cli';

  return {
    async checkTools(tools = []) {
      let binOk = false;
      try {
        exec(`${binary} --version`, { stdio: 'ignore' });
        binOk = true;
      } catch {
        binOk = false;
      }

      return tools.map(tool => ({
        tool,
        ok: binOk,
        auth_status: binOk ? 'ok' : 'missing'
      }));
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
          // Use high-level docs +search command
          const cmd = `${binary} docs +search --page-size 20${pageToken ? ' --page-token \'' + pageToken + '\'' : ''} --format json`;
          const stdout = exec(cmd, { encoding: 'utf8', stdio: 'pipe' }).toString();
          const result = JSON.parse(stdout);
          
          const data = result.data || result;
          // lark-cli docs +search returns items in data.results
          const items = Array.isArray(data.results) ? data.results : (Array.isArray(data.items) ? data.items : []);
          
          // Normalize items to match what mapSearchItemsToSourceItems expects
          const normalizedItems = items.map(item => {
            if (item.result_meta) {
              return {
                ...item.result_meta,
                title: item.title_highlighted || item.title || item.result_meta.title
              };
            }
            return item;
          });

          allItems = allItems.concat(normalizedItems);
          
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
        // Use high-level docs +fetch command
        const cmd = `${binary} docs +fetch --doc ${docId} --format json`;
        const stdout = exec(cmd, { encoding: 'utf8', stdio: 'pipe' }).toString();
        const result = JSON.parse(stdout);
        const data = result.data || result;
        return {
          title: docId,
          // lark-cli docs +fetch returns content in data.markdown
          content: data.markdown || data.content || ''
        };
      } catch (e) {
        logger.error(`CLI fetchDoc error for ${docId}: ${e.message}`);
        return { title: docId, content: '' };
      }
    }
  };
}

module.exports = { createFeishuCLIRuntime };
