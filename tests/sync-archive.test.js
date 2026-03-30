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
