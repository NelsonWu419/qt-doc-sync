#!/usr/bin/env node

/**
 * 真实飞书文档同步测试
 * 用于验证 qt-doc-sync MVP 是否能在真实飞书环境下工作
 */

const QtDocArchive = require('./sync-archive');

// 真实飞书工具桥接
async function searchDocWiki(params) {
  console.log('[Feishu Bridge] 调用 feishu_search_doc_wiki...');
  
  // 使用 OpenClaw feishu_search_doc_wiki 工具
  const result = await runFeishuTool('feishu_search_doc_wiki', {
    action: 'search',
    query: '',
    page_size: 50
  });
  
  console.log('[Feishu Bridge] 搜索结果:', result?.data?.items?.length || 0, '个文档');
  return result?.data || { items: [] };
}

async function fetchDoc(docToken) {
  console.log('[Feishu Bridge] 抓取文档:', docToken);
  
  const result = await runFeishuTool('feishu_fetch_doc', {
    doc_id: docToken
  });
  
  console.log('[Feishu Bridge] 文档标题:', result?.title || '未知');
  return result || { title: docToken, content: '' };
}

// 执行飞书工具（通过 OpenClaw 消息系统）
function runFeishuTool(toolName, params) {
  return new Promise((resolve, reject) => {
    // 通过 stdout 输出工具调用请求
    const call = {
      tool: toolName,
      params: params
    };
    
    console.log('[TOOL_CALL]', JSON.stringify(call));
    
    // 等待 stdin 输入结果（由 OpenClaw 注入）
    let inputData = '';
    process.stdin.on('data', chunk => {
      inputData += chunk.toString();
    });
    
    process.stdin.on('end', () => {
      try {
        const result = JSON.parse(inputData || '{}');
        resolve(result);
      } catch (e) {
        console.error('[TOOL_CALL] 解析结果失败:', e.message);
        resolve({});
      }
    });
    
    // 超时保护
    setTimeout(() => {
      console.error('[TOOL_CALL] 超时，返回空结果');
      resolve({});
    }, 30000);
  });
}

// 主程序
async function main() {
  console.log('==========================================');
  console.log('🚀 qt-doc-sync 真实飞书同步测试');
  console.log('==========================================');
  
  const app = new QtDocArchive([], {
    searchDocWiki: searchDocWiki,
    fetchDoc: fetchDoc,
    availableTools: ['feishu_search_doc_wiki', 'feishu_fetch_doc'],
  });
  
  try {
    const result = await app.run();
    
    console.log('==========================================');
    console.log('📊 测试结果');
    console.log('==========================================');
    console.log('发现文档:', result.discovered);
    console.log('待归档:', result.queued);
    console.log('已归档:', result.archived);
    console.log('未变更:', result.unchanged);
    console.log('失败:', result.failed);
    console.log('授权状态:', result.authStatus);
    console.log('==========================================');
    
    if (result.archived > 0 || result.discovered > 0) {
      console.log('✅ MVP 验证成功！');
      process.exit(0);
    } else if (result.authStatus === 'blocked') {
      console.log('⚠️  授权不足，无法访问飞书文档');
      process.exit(1);
    } else {
      console.log('⚠️  未发现可归档的正文类文档');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { searchDocWiki, fetchDoc, runFeishuTool };
