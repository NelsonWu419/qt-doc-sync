const test = require('node:test');
const assert = require('node:assert/strict');
const QtDocArchive = require('../scripts/sync-archive.js');

test('QtDocArchive loadSourceItems fetches from API when sourceItems is empty', async () => {
  let searchDocsCalled = false;
  
  const mockRuntime = {
    searchDocs: async () => {
      searchDocsCalled = true;
      return []; // empty results
    }
  };

  const app = new QtDocArchive([], { runtime: mockRuntime });
  const items = await app.loadSourceItems();
  
  assert.equal(searchDocsCalled, true, 'Should fetch from API when sourceItems is empty');
  assert.equal(items.length, 0);
});

test('QtDocArchive loadSourceItems skips API fetch when demo sourceItems are provided', async () => {
  let searchDocsCalled = false;
  
  const mockRuntime = {
    searchDocs: async () => {
      searchDocsCalled = true;
      return [];
    }
  };

  const mockDocs = [{
    obj_token: 'demo_doc_001',
    title: 'Demo Document',
    obj_type: 'docx',
    parent_token: 'root',
    update_time: new Date().toISOString(),
  }];

  const app = new QtDocArchive(mockDocs, { runtime: mockRuntime });
  const items = await app.loadSourceItems();
  
  assert.equal(searchDocsCalled, false, 'Should bypass API fetch when mock docs are provided');
  assert.equal(items.length, 1);
  assert.equal(items[0].obj_token, 'demo_doc_001');
});

test('QtDocArchive run resumes from checkpoint', async () => {
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  
  const baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'qt-doc-sync-resume-'));
  const manifestPath = path.join(baseDir, 'manifest.json');
  
  const docs = [
    { obj_token: 'doc_1', title: 'Doc 1', obj_type: 'docx', update_time: '2026-03-30T10:00:00Z' },
    { obj_token: 'doc_2', title: 'Doc 2', obj_type: 'docx', update_time: '2026-03-30T10:00:00Z' },
    { obj_token: 'doc_3', title: 'Doc 3', obj_type: 'docx', update_time: '2026-03-30T10:00:00Z' },
  ];

  // Write manifest with checkpoint at doc_2
  const initialManifest = {
    documents: {
      'doc_1': { archivedAt: 'old', contentHash: 'old' },
      'doc_2': { archivedAt: 'old', contentHash: 'old' },
    },
    checkpoint: { doc_token: 'doc_2' },
    runs: []
  };
  await fs.mkdir(baseDir, { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(initialManifest));

  let fetchCount = 0;
  const mockRuntime = {
    checkTools: async () => [{ tool: 'feishu_fetch_doc', ok: true, auth_status: 'ok' }],
    searchDocs: async () => docs,
    fetchDoc: async (id) => {
      fetchCount++;
      return { title: id, content: 'new' };
    }
  };

  const app = new QtDocArchive([], { 
    runtime: mockRuntime,
    targetDirectory: baseDir
  });
  
  await app.run();
  
  // doc_1 and doc_2 should be skipped because doc_2 is the checkpoint.
  // only doc_3 should be fetched.
  assert.equal(fetchCount, 1, 'Should only fetch 1 doc (the one after checkpoint)');
  
  const finalManifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  assert.equal(finalManifest.checkpoint.doc_token, 'doc_3');
});

