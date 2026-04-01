# qt-doc-sync

飞书文档单向归档系统。支持通过官方 `lark-cli` 或 `OpenClaw` 桥接协议将云端文档安全地归档到本地。

## 最新版本

- **v1.2.0**：**混合运行时集成**。支持官方 CLI 模式（默认）和 OpenClaw 平台模式，实现真实环境下的文档全量搜索与抓取。
- **v1.1.0**：架构闭环，完成基础骨架与 MVP 链路。

## 核心定位

- **单向归档**：只从飞书读取，只向本地写入。
- **安全隔离**：不回写云端，不伪装双向同步，确保云端数据绝对安全。
- **结构化存储**：按文档类型分层保存原始数据、标准化 Markdown 和历史版本。

## 快速开始

### 1. 环境准备 (推荐 CLI 模式)
安装官方飞书 CLI 工具并完成本地授权：
```bash
npm install -g @larksuite/cli
lark-cli config init  # 初始化配置
lark-cli auth login    # 浏览器登录授权
```

### 2. 执行同步
在项目根目录下运行脚本：
```bash
# 默认使用 CLI 模式同步（推荐）
node scripts/sync-archive.js --batch-size 5 --verbose

# 强制使用 OpenClaw 桥接模式
node scripts/sync-archive.js --runtime openclaw --batch-size 5
```

## 参数说明

| 参数 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `--runtime` | 运行时策略: `cli` (推荐) 或 `openclaw` | `cli` |
| `--batch-size` | 单次运行处理的最大文档数 | 无限制 |
| `--verbose` | 输出详细日志 (包括 API 调用详情) | `false` |
| `--dry-run` | 模拟运行，不写入本地文件 | `false` |
| `--target-dir` | 指定归档根目录 | `./company-docs/01-feishu-archive` |

## 目录结构

同步后的本地数据将按以下结构保存：
```text
company-docs/01-feishu-archive/
├── manifest.json       # 全局状态清单
├── logs/               # 运行日志
├── raw/                # 原始抓取数据 (JSON)
├── normalized/         # 标准化文档 (Markdown)
└── history/            # 历史版本记录
```

## 当前状态

### 已完成
- [x] **混合运行时工厂**: 动态切换 CLI 和桥接模式。
- [x] **Feishu CLI 集成**: 调用 `lark-cli` 实现真环境搜索与正文转 Markdown。
- [x] **增量同步逻辑**: 基于内容 Hash 和时间戳判断变更，避免重复下载。
- [x] **文档类型支持**: 完整支持 `doc` / `docx` / `wiki` / `mindnote`。
- [x] **错误保护**: 接口超时、权限不足及限流时的自动保护机制。

### 后续规划
- [ ] Sheet 表格数据的结构化归档。
- [ ] Bitable 数据库的 Schema 与记录归档。
- [ ] 归档文件的全文索引生成。

## 开发与测试

```bash
# 运行单元测试 (包含 CLI 模拟测试)
npm test

# 运行特定测试
node --test tests/runtime-cli.test.js
```
