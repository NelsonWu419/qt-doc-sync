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
      // If we see [TOOL_CALL], we can close stdin to force it to move on or fail gracefully
      if (stderr.includes('[TOOL_CALL]')) {
         child.stdin.end();
      }
    });

    // Also check stdout for TOOL_CALL since some logs go there
    child.stdout.on('data', (data) => {
      if (data.toString().includes('[TOOL_CALL]')) {
        child.stdin.end();
      }
    });
    
    const exitPromise = new Promise((resolve) => {
      child.on('close', resolve);
    });

    // Force kill after 5 seconds if still running
    const timeout = setTimeout(() => child.kill(), 5000);
    
    const exitCode = await exitPromise;
    clearTimeout(timeout);
    
    assert.ok(!stdout.includes('demo_doc_001'), 'Output should not contain demo document in normal run');
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
      if (data.toString().includes('[TOOL_CALL]')) {
        child.stdin.end();
      }
    });

    child.stderr.on('data', (data) => {
      if (data.toString().includes('[TOOL_CALL]')) {
        child.stdin.end();
      }
    });
    
    const exitPromise = new Promise((resolve) => {
      child.on('close', resolve);
    });

    const timeout = setTimeout(() => child.kill(), 5000);
    await exitPromise;
    clearTimeout(timeout);
    
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
