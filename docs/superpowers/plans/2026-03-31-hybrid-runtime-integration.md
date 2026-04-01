# Hybrid Feishu Runtime Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable local development to hit live Feishu APIs using the official Feishu Developer CLI as a runtime strategy.

**Architecture:** Introduce a `FeishuCLIRuntime` that wraps the `feishu` command-line tool. Use a factory pattern to switch between the OpenClaw bridge and the local CLI based on a new `--runtime` flag.

**Tech Stack:** Node.js, Child Process (execSync), Feishu API.

---

### Task 1: Update CLI Argument Parsing

**Files:**
- Modify: `scripts/sync-archive.js`

- [ ] **Step 1: Update `parseArgs` to support `--runtime` and `--verbose`**

Update the `config` object and loop in `parseArgs` to include `runtime` (default 'openclaw') and ensure `verbose` is handled correctly.

- [ ] **Step 2: Run existing smoke tests to ensure no regressions**

Run: `node --test tests/smoke.test.js`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add scripts/sync-archive.js
git commit -m "feat: add --runtime flag to sync-archive CLI"
```

---

### Task 2: Implement FeishuCLIRuntime Skeleton

**Files:**
- Create: `src/runtime-cli/index.js`
- Create: `tests/runtime-cli.test.js`

- [ ] **Step 1: Write initial test for `FeishuCLIRuntime`**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/runtime-cli.test.js`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `createFeishuCLIRuntime` skeleton**

```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/runtime-cli.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/runtime-cli/index.js tests/runtime-cli.test.js
git commit -m "feat: implement FeishuCLIRuntime skeleton and tool check"
```

---

### Task 3: Implement Search Logic in FeishuCLIRuntime

**Files:**
- Modify: `src/runtime-cli/index.js`
- Modify: `tests/runtime-cli.test.js`

- [ ] **Step 1: Write test for `searchDocs`**

```javascript
test('FeishuCLIRuntime searchDocs parses CLI JSON output', async () => {
  const mockOutput = JSON.stringify({
    data: {
      items: [{ obj_token: 'cli_doc_001', obj_type: 'docx', title: 'CLI Doc' }],
      has_more: false
    }
  });
  const mockDeps = {
    execSync: (cmd) => {
      if (cmd.includes('api get')) return Buffer.from(mockOutput);
      return Buffer.from('');
    }
  };
  const runtime = createFeishuCLIRuntime(mockDeps);
  const docs = await runtime.searchDocs();
  assert.equal(docs.length, 1);
  assert.equal(docs[0].obj_token, 'cli_doc_001');
});
```

- [ ] **Step 2: Implement `searchDocs` using `feishu api get`**

Wrap the search command in a loop to handle pagination.

- [ ] **Step 3: Run tests**

Run: `node --test tests/runtime-cli.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/runtime-cli/index.js tests/runtime-cli.test.js
git commit -m "feat: implement searchDocs in FeishuCLIRuntime"
```

---

### Task 4: Implement Fetch Logic in FeishuCLIRuntime

**Files:**
- Modify: `src/runtime-cli/index.js`
- Modify: `tests/runtime-cli.test.js`

- [ ] **Step 1: Write test for `fetchDoc`**

```javascript
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
```

- [ ] **Step 2: Implement `fetchDoc`**

Use `feishu api get /open-apis/docx/v1/documents/${docId}/raw_content`.

- [ ] **Step 3: Run tests**

Run: `node --test tests/runtime-cli.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/runtime-cli/index.js tests/runtime-cli.test.js
git commit -m "feat: implement fetchDoc in FeishuCLIRuntime"
```

---

### Task 5: Integrate Runtime Factory

**Files:**
- Modify: `src/runtime/index.js`
- Modify: `scripts/sync-archive.js`

- [ ] **Step 1: Update `src/runtime/index.js` to export factory**

Implement `createRuntime(type, config)` that switches between `cli` and `openclaw`.

- [ ] **Step 2: Update `scripts/sync-archive.js` to use factory**

Pass `cliConfig.runtime` to the factory in the `QtDocArchive` constructor.

- [ ] **Step 3: Update `printHelp` in `scripts/sync-archive.js`**

Include `--runtime` and descriptions.

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/runtime/index.js scripts/sync-archive.js
git commit -m "feat: integrate hybrid runtime factory and update help documentation"
```
