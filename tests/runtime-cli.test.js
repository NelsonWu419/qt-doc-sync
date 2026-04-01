const test = require('node:test');
const assert = require('node:assert/strict');
const { createFeishuCLIRuntime } = require('../src/runtime-cli');

test('FeishuCLIRuntime checkTools reports missing when lark-cli command fails', async () => {
  const mockDeps = {
    execSync: () => { throw new Error('command not found'); }
  };
  const runtime = createFeishuCLIRuntime(mockDeps);
  const results = await runtime.checkTools(['feishu']);
  assert.equal(results[0].ok, false);
});

test('FeishuCLIRuntime searchDocs parses CLI JSON output', async () => {
  const mockOutput = JSON.stringify({
    data: {
      items: [{ obj_token: 'cli_doc_001', obj_type: 'docx', title: 'CLI Doc' }],
      has_more: false
    }
  });
  const mockDeps = {
    execSync: (cmd) => {
      if (cmd.includes('api GET')) return Buffer.from(mockOutput);
      return Buffer.from('');
    }
  };
  const runtime = createFeishuCLIRuntime(mockDeps);
  const docs = await runtime.searchDocs();
  assert.equal(docs.length, 1);
  assert.equal(docs[0].obj_token, 'cli_doc_001');
});

test('FeishuCLIRuntime fetchDoc parses CLI content output', async () => {
  const mockOutput = JSON.stringify({
    data: {
      content: '# CLI Content'
    }
  });
  const mockDeps = {
    execSync: () => Buffer.from(mockOutput)
  };
  const runtime = createFeishuCLIRuntime(mockDeps);
  const doc = await runtime.fetchDoc('doc_001');
  assert.equal(doc.content, '# CLI Content');
});
