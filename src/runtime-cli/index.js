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
      return [];
    },
    async fetchDoc(docId) {
      return { title: docId, content: '' };
    }
  };
}

module.exports = { createFeishuCLIRuntime };
