const test = require('node:test');
const assert = require('node:assert/strict');
const { createFeishuCLIRuntime } = require('../src/runtime-cli');

test('FeishuCLIRuntime checkTools reports missing when feishu command fails', async () => {
  const mockDeps = {
    execSync: () => { throw new Error('command not found'); }
  };
  const runtime = createFeishuCLIRuntime(mockDeps);
  const results = await runtime.checkTools(['feishu']);
  assert.equal(results[0].ok, false);
});
