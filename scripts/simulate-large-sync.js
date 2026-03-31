#!/usr/bin/env node

/**
 * 大规模文档同步模拟测试 (400个文档)
 * 用于验证分页、批次处理以及大规模同步下的稳定性
 */

const QtDocArchive = require('./sync-archive');
const { logger } = require('../src/utils/logger');

// 模拟飞书 API，生成 400 个文档
function generateMockDocs(count) {
  const docs = [];
  for (let i = 1; i <= count; i++) {
    docs.push({
      obj_token: `mock_doc_${String(i).padStart(3, '0')}`,
      title: `模拟测试文档 ${String(i).padStart(3, '0')}`,
      obj_type: 'docx',
      update_time: new Date().toISOString()
    });
  }
  return docs;
}

const ALL_MOCK_DOCS = generateMockDocs(400);

// 模拟分页搜索
async function mockSearchDocWiki(params) {
  const pageSize = 50;
  // 简单模拟分页逻辑：根据 page_token (如果有) 返回对应的切片
  const pageToken = params.page_token || '0';
  const start = parseInt(pageToken, 10);
  const end = start + pageSize;
  
  const items = ALL_MOCK_DOCS.slice(start, end);
  const hasMore = end < ALL_MOCK_DOCS.length;
  const nextPageToken = hasMore ? String(end) : null;

  console.log(`[Mock API] 搜索请求: page_token=${pageToken}, 返回 ${items.length} 个文档, has_more=${hasMore}`);

  return {
    data: {
      items: items,
      has_more: hasMore,
      page_token: nextPageToken
    }
  };
}

async function mockFetchDoc(docId) {
  return {
    title: `标题-${docId}`,
    content: `# 模拟内容\n这是文档 ${docId} 的正文内容。`
  };
}

async function main() {
  console.log('==========================================');
  console.log('🧪 大规模文档同步模拟测试 (400个文档)');
  console.log('==========================================');

  // 1. 测试默认运行 (不传 sourceItems，触发 runtime.searchDocs)
  const app = new QtDocArchive([], {
    searchDocWiki: mockSearchDocWiki,
    fetchDoc: mockFetchDoc,
    availableTools: ['feishu_search_doc_wiki', 'feishu_fetch_doc']
  });

  // 设置为 dryRun 避免实际写文件，但验证逻辑
  app.dryRun = true;
  
  try {
    console.log('\n--- 阶段 1: 验证文档发现 (Discovery) ---');
    const result = await app.run();
    
    console.log('\n--- 阶段 2: 结果分析 ---');
    console.log(`发现文档总数: ${result.discovered}`);
    
    if (result.discovered === 400) {
      console.log('✅ 成功：发现了全部 400 个文档！');
    } else {
      console.log(`⚠️  警告：仅发现了 ${result.discovered} 个文档。这可能是因为尚未实现分页抓取逻辑。`);
    }

    console.log('\n--- 阶段 3: 批次测试 (Batching) ---');
    console.log('设置批次大小为 20...');
    app.batchSize = 20;
    // 重置统计
    app.stats = { discovered: 0, queued: 0, archived: 0, updated: 0, unchanged: 0, failed: 0, rateLimited: 0 };
    const batchResult = await app.run();
    console.log(`批次处理完成：discovered=${batchResult.discovered}, archived=${batchResult.archived}`);
    
    if (batchResult.discovered === 20) {
      console.log('✅ 成功：批次限制生效。');
    }

  } catch (err) {
    console.error('❌ 测试过程中发生错误:', err);
    process.exit(1);
  }
}

main();
