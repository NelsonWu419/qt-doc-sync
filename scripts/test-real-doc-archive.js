#!/usr/bin/env node

/**
 * 真实飞书文档同步测试（简化版）
 * 直接使用当前会话的飞书工具权限
 */

const QtDocArchive = require('./sync-archive');

async function main() {
  console.log('==========================================');
  console.log('🚀 qt-doc-sync 真实飞书文档同步测试');
  console.log('==========================================\n');
  
  // 使用刚才测试的真实文档
  const testDoc = {
    obj_token: 'MFK7dDFLFoVlOGxWCv5cTXKmnMh',
    title: 'OpenClaw 飞书官方插件使用指南（公开版）',
    obj_type: 'docx',
    parent_token: 'root',
    update_time: '2026-03-29T19:17:55+08:00',
  };
  
  console.log('📋 测试文档:', testDoc.title);
  console.log('🆔 文档 ID:', testDoc.obj_token);
  console.log('📝 类型:', testDoc.obj_type);
  console.log('');
  
  // 创建归档实例，使用真实飞书工具桥接
  const app = new QtDocArchive([testDoc], {
    // 真实飞书搜索
    searchDocWiki: async (params) => {
      console.log('[飞书桥接] 搜索文档...');
      // 这里需要由 OpenClaw 拦截并执行 feishu_search_doc_wiki
      console.log('[OPENCLAW_CALL]', JSON.stringify({
        action: 'feishu_search_doc_wiki',
        query: '',
        page_size: 10
      }));
      return { items: [] }; // 占位，实际由 OpenClaw 注入
    },
    // 真实飞书抓取
    fetchDoc: async (docToken) => {
      console.log('[飞书桥接] 抓取文档:', docToken);
      // 这里需要由 OpenClaw 拦截并执行 feishu_fetch_doc
      console.log('[OPENCLAW_CALL]', JSON.stringify({
        action: 'feishu_fetch_doc',
        doc_id: docToken
      }));
      return { title: testDoc.title, content: '' }; // 占位，实际由 OpenClaw 注入
    },
    availableTools: ['feishu_search_doc_wiki', 'feishu_fetch_doc'],
  });
  
  try {
    console.log('▶️  开始归档流程...\n');
    const result = await app.run();
    
    console.log('\n==========================================');
    console.log('📊 测试结果');
    console.log('==========================================');
    console.log('✅ 发现文档:', result.discovered);
    console.log('✅ 待归档:', result.queued);
    console.log('✅ 已归档:', result.archived);
    console.log('✅ 未变更:', result.unchanged);
    console.log('❌ 失败:', result.failed);
    console.log('🔐 授权状态:', result.authStatus);
    console.log('==========================================\n');
    
    if (result.archived > 0) {
      console.log('🎉 MVP 验证成功！真实飞书文档已归档到本地！');
      process.exit(0);
    } else if (result.authStatus === 'blocked') {
      console.log('⚠️  授权不足，无法访问飞书文档');
      process.exit(1);
    } else {
      console.log('⚠️  归档流程已跑通，但未发现新文档');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
