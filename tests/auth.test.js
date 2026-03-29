const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyAuthError, buildPreflightPlan, summarizePreflight } = require('../src/auth');

test('classifies missing auth error', () => {
  const out = classifyAuthError(new Error('unauthorized: token missing'));
  assert.equal(out.auth_status, 'missing');
});

test('classifies expired auth error', () => {
  const out = classifyAuthError(new Error('token expired'));
  assert.equal(out.auth_status, 'expired');
});

test('builds preflight plan for text-only MVP', () => {
  const out = buildPreflightPlan(['docx', 'sheet', 'bitable']);
  assert.deepEqual(out.requiredTools.sort(), [
    'feishu_fetch_doc',
    'feishu_search_doc_wiki',
  ].sort());
});

test('summarizes partial auth availability', () => {
  const out = summarizePreflight([
    { tool: 'feishu_fetch_doc', ok: true },
    { tool: 'feishu_sheet', ok: false, auth_status: 'insufficient_scope' },
  ]);
  assert.equal(out.auth_status, 'partial');
  assert.equal(out.availableTools.length, 1);
  assert.equal(out.blockedTools.length, 1);
});
