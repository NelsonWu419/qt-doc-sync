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
  
  const items = result?.data?.items || result?.items || [];
  console.log('[Feishu Bridge] 搜索结果:', items.length, '个文档');
  return result;
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
  return new Promise((resolve) => {
    const callId = Math.random().toString(36).substring(7);
    const call = {
      tool: toolName,
      params: params,
      callId: callId
    };
    
    // 通过 stdout 输出工具调用请求
    process.stdout.write(`[TOOL_CALL] ${JSON.stringify(call)}\n`);
    
    // 等待 stdin 输入结果（由 OpenClaw 注入）
    let inputData = '';
    const onData = (chunk) => {
      inputData += chunk.toString();
      const lines = inputData.split('\n');
      inputData = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const response = JSON.parse(line.trim());
          if (response.callId === callId) {
            process.stdin.removeListener('data', onData);
            resolve(response.result !== undefined ? response.result : (response.data !== undefined ? response.data : response));
            return;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    };
    
    process.stdin.on('data', onData);
    
    // 超时保护
    setTimeout(() => {
      process.stdin.removeListener('data', onData);
      console.error('[TOOL_CALL] 超时，返回空结果');
      resolve({});
    }, 60000);
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
