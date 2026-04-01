# Spec: Hybrid Feishu Runtime & CLI Integration

## Overview
Currently, the `qt-doc-sync` project relies solely on the OpenClaw Tool Bridge for Feishu access. This creates a "black box" during local development where it is difficult to verify if "zero results" are due to code bugs, platform issues, or Feishu permission errors. 

This design introduces a **Hybrid Runtime Architecture** that allows developers to use the official **Feishu Developer CLI** for local "Live" verification while maintaining full compatibility with the OpenClaw environment.

## Goals
- Enable local development to hit live Feishu APIs using the active `feishu login` session.
- Keep the core synchronization logic (diffing, archiving, normalization) identical across environments.
- Provide clear error messaging when APIs fail or return unexpected structures.

## Architecture

### 1. Runtime Strategy Interface
The system will interact with a generic `Runtime` interface defined as:
```typescript
interface Runtime {
  checkTools(tools: string[]): Promise<any[]>;
  searchDocs(): Promise<DocumentRecord[]>;
  fetchDoc(docId: string): Promise<{ title: string, content: string }>;
}
```

### 2. Runtime Implementations
- **OpenClawRuntime**: (Existing) Communicates via `[TOOL_CALL]` and `stdin/stdout`.
- **FeishuCLIRuntime**: (New) Wraps `child_process.execSync` to call the `feishu` binary.

### 3. Factory Logic
A new `createRuntime` factory will be added to `src/runtime/index.js`:
```javascript
function createRuntime(type, config) {
  if (type === 'cli') return createFeishuCLIRuntime(config);
  return createOpenClawRuntime(config);
}
```

## FeishuCLIRuntime Details

### Search Implementation
**Command:** 
`feishu api get /open-apis/search/v2/nodes --params '{"query":"", "page_size":20}'`

**Logic:**
1. Execute the command and capture `stdout`.
2. Parse JSON.
3. Handle pagination by checking `has_more` and re-running with `page_token`.
4. Return results in the standard `items` format.

### Fetch Implementation
**Command:** 
`feishu api get /open-apis/docx/v1/documents/:document_id/raw_content`

**Logic:**
1. Execute command.
2. Extract title and markdown/raw content.

## CLI Integration in `sync-archive.js`
Add a new flag `--runtime [openclaw|cli]`.
- Default is `openclaw`.
- If `cli` is specified, the script attempts to verify the `feishu` command is available before starting.

## Error Handling
- **CLI Not Found**: Log clear error: "Feishu CLI not found in PATH. Please install via 'npm install -g @feishu/cli'."
- **Session Expired**: Capture "unauthorized" error from CLI and prompt the user to run `feishu login`.
- **Invalid API Response**: Use the existing `logger` to dump the raw CLI output for debugging.

## Success Criteria
1. `node scripts/sync-archive.js --runtime cli --dry-run` successfully lists the same documents found in the user's real Feishu account.
2. The same code works in OpenClaw without any manual changes.
3. No secrets (AppID/Secret) are stored in the codebase (leveraging the local CLI session).
