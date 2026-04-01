#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { discover } = require('../src/discovery');
const { diffPlan } = require('../src/diff');
const { normalize } = require('../src/normalizer');
const { archiveOne } = require('../src/archiver');
const { memorySync } = require('../src/memory-sync');
const { buildSummary, formatSummary } = require('../src/reporter');
const { guarded } = require('../src/guard');
const { buildPreflightPlan, summarizePreflight } = require('../src/auth');
const { mapSearchItemsToSourceItems } = require('../src/feishu-adapter');
const { createRuntime } = require('../src/runtime');
const { computeDocumentHashes } = require('../src/utils/hash');
const { logger } = require('../src/utils/logger');

// CLI 参数解析
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    targetDir: null,
    batchSize: null,
    runtime: 'cli',
    dryRun: false,
    help: false,
    stdin: false,
    demo: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target-dir' && args[i + 1]) {
      config.targetDir = args[++i];
    } else if (args[i] === '--batch-size' && args[i + 1]) {
      config.batchSize = parseInt(args[++i], 10);
    } else if (args[i] === '--runtime' && args[i + 1]) {
      config.runtime = args[++i];
    } else if (args[i] === '--dry-run') {
      config.dryRun = true;
    } else if (args[i] === '--stdin') {
      config.stdin = true;
    } else if (args[i] === '--demo') {
      config.demo = true;
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      config.verbose = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      config.help = true;
    }
  }

  return config;
}

function printHelp() {
  console.log(`
qt-doc-sync - 飞书文档单向归档工具

用法：node sync-archive.js [选项]

选项:
  --target-dir <path>    归档目标目录（默认：./company-docs/01-feishu-archive）
  --batch-size <number>  批次处理数量（默认：全部）
  --runtime <type>       运行环境策略，可选：openclaw, cli（默认：openclaw）
  --dry-run              空跑模式，不实际写入文件
  --help, -h             显示帮助信息

示例:
  node sync-archive.js --dry-run
  node sync-archive.js --target-dir /path/to/archive --batch-size 20
`);
}

const DEFAULT_TARGET_DIRECTORY = path.resolve(__dirname, '../company-docs/01-feishu-archive');
const cliConfig = parseArgs();

if (cliConfig.help) {
  printHelp();
  process.exit(0);
}

class QtDocArchive {
  constructor(sourceItems = [], options = {}) {
    this.sourceItems = sourceItems;
    this.runtime = options.runtime || createRuntime(cliConfig.runtime, {
      searchDocWiki: options.searchDocWiki,
      fetchDoc: options.fetchDoc,
      availableTools: options.availableTools,
    });
    this.targetDirectory = options.targetDirectory || cliConfig.targetDir || DEFAULT_TARGET_DIRECTORY;
    this.dryRun = options.dryRun !== undefined ? options.dryRun : cliConfig.dryRun;
    this.batchSize = options.batchSize || cliConfig.batchSize || null;
    this.manifestPath = path.join(this.targetDirectory, 'manifest.json');
    this.logPath = path.join(this.targetDirectory, 'logs', 'sync.log');

    // Initialize logger
    logger.setLogPath(this.logPath);
    if (cliConfig.verbose) {
      logger.level = 'debug';
    }

    this.manifest = { documents: {}, runs: [] };
    this.stats = {
      discovered: 0,
      queued: 0,
      archived: 0,
      updated: 0,
      unchanged: 0,
      failed: 0,
      rateLimited: 0,
    };
  }

  async init() {
    await fs.mkdir(this.targetDirectory, { recursive: true });
    await fs.mkdir(path.join(this.targetDirectory, 'logs'), { recursive: true });
    try {
      const data = await fs.readFile(this.manifestPath, 'utf8');
      this.manifest = JSON.parse(data);
    } catch {
      await this.saveManifest();
    }
  }

  async saveManifest() {
    if (this.dryRun) return;
    await fs.writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2), 'utf8');
  }

  async log(line) {
    logger.info(line);
  }

  async preflight(types = ['docx']) {
    const plan = buildPreflightPlan(types);
    const results = await this.runtime.checkTools(plan.requiredTools);
    return summarizePreflight(results);
  }

  async loadSourceItems() {
    if (this.sourceItems && this.sourceItems.length > 0) {
      await this.log(`[Discovery] 使用预设的 ${this.sourceItems.length} 个项目`);
      return this.sourceItems;
    }
    await this.log('[Discovery] 正在从 API 加载项目...');
    const searchResults = await this.runtime.searchDocs();
    await this.log(`[Discovery] API 返回了 ${searchResults.length} 个有效项目`);
    return searchResults;
  }

  async fetchByDoc(doc) {
    const type = String(doc.obj_type || '').toLowerCase();
    if (['doc', 'docx', 'wiki', 'mindnote'].includes(type)) {
      const payload = await this.runtime.fetchDoc(doc.doc_token);
      return { status: 'ok', kind: 'text', payload: { text: payload.content || '' } };
    }
    return { status: 'unsupported', kind: 'unsupported', payload: null };
  }

  async run() {
    if (this.dryRun) {
      this.log('[DRY RUN] 空跑模式 - 不会实际写入文件');
    }
    
    await this.init();
    const startedAt = new Date().toISOString();
    this.manifest.runs.push({ startedAt, status: 'running' });
    await this.saveManifest();

    try {
      const sourceItems = await this.loadSourceItems();
      const types = [...new Set(sourceItems.map((i) => String(i.obj_type || 'unknown').toLowerCase()))];
      const preflight = await this.preflight(types.length ? types : ['docx']);

      if (preflight.auth_status === 'blocked') {
        const blockedSummary = buildSummary(this.stats, { written: false, count: 0 }, { authStatus: 'blocked' });
        this.manifest.runs[this.manifest.runs.length - 1] = {
          startedAt,
          finishedAt: new Date().toISOString(),
          status: 'blocked',
          stats: blockedSummary,
        };
        await this.saveManifest();
        await this.log(formatSummary(blockedSummary));
        return blockedSummary;
      }

      const records = discover(sourceItems).map((r) => {
        const hashes = computeDocumentHashes({
          content: r.content ?? r.payload?.text ?? r.doc_token,
          schema: r.schema ?? { obj_type: r.obj_type },
        });

        return {
          ...r,
          content_hash: hashes.contentHash,
          schema_hash: hashes.schemaHash,
        };
      });
      
      // 应用批次大小限制
      let limitedRecords = records;
      if (this.batchSize && this.batchSize > 0 && records.length > this.batchSize) {
        limitedRecords = records.slice(0, this.batchSize);
        this.log(`[批次限制] 仅处理前 ${this.batchSize} 个文档（共 ${records.length} 个）`);
      }
      
      this.stats.discovered = limitedRecords.length;

      const queue = diffPlan(limitedRecords, this.manifest);
      
      // Resume from checkpoint if exists
      const checkpointToken = this.manifest.checkpoint?.doc_token;
      let actualQueue = queue;
      if (checkpointToken && queue.some(d => d.doc_token === checkpointToken)) {
        const index = queue.findIndex(d => d.doc_token === checkpointToken);
        actualQueue = queue.slice(index + 1);
        this.log(`[断点续传] 从 ${checkpointToken} 之后恢复，剩余数量: ${actualQueue.length}`);
      }

      this.stats.queued = actualQueue.length;
      this.stats.unchanged = limitedRecords.length - actualQueue.length;

      let memoryCount = 0;
      let processedSinceSave = 0;
      for (const doc of actualQueue) {
        try {
          const fetched = await guarded(() => this.fetchByDoc(doc), { delayMs: 10, retries: 1 });
          if (fetched.status === 'unsupported') {
            this.stats.failed += 1;
            continue;
          }

          const normalized = normalize(fetched, doc);
          
          if (!this.dryRun) {
            const archived = archiveOne(this.targetDirectory, doc, normalized, fetched.payload, {
              manifest: this.manifest,
            });
            this.manifest.checkpoint = {
              doc_token: doc.doc_token,
              archivedAt: new Date().toISOString(),
              historyPath: archived.historyPath,
            };
          } else {
            this.log(`[DRY RUN] 跳过归档：${doc.title}`);
          }

          const mem = memorySync(
            { items: [{ type: 'decision', title: `归档 ${doc.title}`, summary: `归档 ${doc.doc_token}` }] },
            { status: 'archived' },
            []
          );
          memoryCount += mem.count;

          if (!this.dryRun) {
            this.manifest.documents[doc.doc_token] = {
              title: doc.title,
              obj_type: doc.obj_type,
              sourceUpdateTime: doc.source_update_time,
              contentHash: doc.content_hash,
              schemaHash: doc.schema_hash,
              archivedAt: new Date().toISOString(),
              status: 'archived',
            };
          } else {
            this.log(`[DRY RUN] 跳过 manifest 更新：${doc.doc_token}`);
          }

          this.stats.archived += 1;
          if (doc.status === 'updated') this.stats.updated += 1;

          processedSinceSave += 1;
          if (processedSinceSave >= 10) {
            await this.saveManifest();
            processedSinceSave = 0;
          }
        } catch (err) {
          this.stats.failed += 1;
          await this.log(`archive failed: ${doc.doc_token} | ${err.message}`);
        }
      }

      const summary = buildSummary(this.stats, { written: memoryCount > 0, count: memoryCount }, { authStatus: preflight.auth_status });
      this.manifest.runs[this.manifest.runs.length - 1] = {
        startedAt,
        finishedAt: new Date().toISOString(),
        status: this.dryRun ? 'dry-run' : 'success',
        stats: summary,
      };
      await this.saveManifest();
      await this.log(formatSummary(summary));
      return summary;
    } catch (err) {
      this.manifest.runs[this.manifest.runs.length - 1] = {
        startedAt,
        finishedAt: new Date().toISOString(),
        status: 'error',
        error: err.message,
        stats: this.stats,
      };
      await this.saveManifest();
      await this.log(`fatal: ${err.message}`);
      throw err;
    }
  }
}

if (require.main === module) {
  if (cliConfig.help) {
    printHelp();
    process.exit(0);
  }
  
  const demoItems = cliConfig.demo ? [
    {
      obj_token: 'demo_doc_001',
      title: 'Demo Document',
      obj_type: 'docx',
      parent_token: 'root',
      update_time: new Date().toISOString(),
    },
  ] : [];

  const app = new QtDocArchive(demoItems);
  app.run().catch((err) => {
    console.error(`[Error] ${err.message}`);
    process.exitCode = 1;
  });
}

module.exports = QtDocArchive;
