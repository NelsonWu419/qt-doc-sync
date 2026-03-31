const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs').promises;
const os = require('node:os');

test('CLI smoke test: non-demo run should not include demo_doc_001', async (t) => {
  const scriptPath = path.resolve(__dirname, '../scripts/sync-archive.js');
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'qt-doc-sync-smoke-'));
  
  try {
    // Run with --dry-run to avoid actual writes, but --target-dir to redirect manifest
    const child = spawn('node', [scriptPath, '--dry-run', '--target-dir', tempDir]);
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
    });
    
    // It might exit with 0 or error depending on if tools are "available"
    // But we mainly care about what it TRIED to do.
    assert.ok(!stdout.includes('demo_doc_001'), 'Output should not contain demo document in normal run');
    assert.ok(!stdout.includes('Demo Document'), 'Output should not contain demo title in normal run');
    
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('CLI smoke test: --demo flag should include demo_doc_001', async (t) => {
  const scriptPath = path.resolve(__dirname, '../scripts/sync-archive.js');
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'qt-doc-sync-smoke-demo-'));
  
  try {
    const child = spawn('node', [scriptPath, '--demo', '--dry-run', '--target-dir', tempDir]);
    
    let stdout = '';
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    await new Promise((resolve) => {
      child.on('close', resolve);
    });
    
    assert.ok(stdout.includes('demo_doc_001') || stdout.includes('Demo Document'), 'Output should contain demo document when --demo is used');
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('CLI smoke test: help flag works', async (t) => {
  const scriptPath = path.resolve(__dirname, '../scripts/sync-archive.js');
  
  const child = spawn('node', [scriptPath, '--help']);
  
  let stdout = '';
  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });
  
  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
  });
  
  assert.equal(exitCode, 0);
  assert.ok(stdout.includes('用法：node sync-archive.js'), 'Output should contain usage instructions');
});
