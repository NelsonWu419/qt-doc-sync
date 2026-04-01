const { createOpenClawRuntime } = require('../runtime-openclaw');
const { createFeishuCLIRuntime } = require('../runtime-cli');

function createMockRuntime(config = {}) {
  const availableTools = new Set(config.availableTools || []);
  const searchResults = config.searchResults || [];
  const textDocs = config.textDocs || {};

  return {
    async checkTools(tools = []) {
      return tools.map((tool) => ({
        tool,
        ok: availableTools.has(tool),
        auth_status: availableTools.has(tool) ? 'ok' : 'missing',
      }));
    },
    async searchDocs() {
      return searchResults;
    },
    async fetchDoc(docId) {
      return textDocs[docId] || { title: docId, content: '' };
    },
  };
}

function createRuntime(type, config = {}) {
  if (type === 'cli') {
    return createFeishuCLIRuntime(config);
  }
  if (type === 'mock') {
    return createMockRuntime(config);
  }
  return createOpenClawRuntime(config);
}

module.exports = { createMockRuntime, createRuntime };
