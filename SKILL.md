---
name: qt-doc-sync
description: 飞书文档单向归档到本地的技能。按文档类型分层保存原始数据、标准化结果和历史版本；支持增量归档、限流保护、断点恢复和可审计日志。仅允许飞书 → 本地，不回写云端。
---

# qt-doc-sync

## 定位

这是一个**单向文档归档系统**，不是双向同步系统。

### 核心承诺
- 只从飞书读取
- 只向本地写入
- 不回写云端
- 不伪装双向同步

## 适用场景

当你需要：
- 将飞书文档定期归档到本地
- 为飞书文档建立只读副本
- 保留文档历史版本
- 按文档类型分层存储
- 生成可审计的变更日志
- 控制 API 调用频率，避免限流

## 设计原则

### 1. 单向优先
所有流程都以飞书为源。本地只做归档，不参与写回。

### 2. 类型分流
不同对象使用不同处理策略：
- `doc / docx / wiki / mindnote`：正文类
- `sheet`：表格类
- `bitable`：数据库类

### 3. 分层落盘
每个对象至少分为：
- `raw/`：原始抓取结果
- `normalized/`：标准化结果
- `history/`：历史版本
- `meta/`：元数据与状态

### 4. 可审计
每次运行都应输出：
- 抓取时间
- 变更原因
- 成功数
- 失败数
- 限流数
- 本地路径

### 5. 可恢复
任务中断后，应能基于 manifest 或 checkpoint 继续执行。

## 工作流程

### 1. 枚举来源
- 拉取可访问文档列表
- 获取基础元信息
- 按类型分流

### 2. 计算变更
- 读取本地 manifest
- 对比时间戳、内容 hash、结构 hash
- 生成待归档队列

### 3. 分类型抓取
- 正文类：抓取正文内容并转 Markdown
- 表格类：导出结构化表数据
- bitable：先抓 schema，再抓 records
- wiki：保留树结构映射

### 4. 标准化
- 统一编码
- 统一目录
- 统一元数据字段
- 统一日志格式

### 5. 落盘
推荐顺序：
1. 写 raw
2. 写 normalized
3. 写 history
4. 更新 manifest

### 6. 报告
- 输出运行摘要
- 输出失败明细
- 输出限流统计

## 本地目录结构

```text
company-docs/01-feishu-archive/
├── manifest.json
├── logs/
│   └── sync.log
├── raw/
│   └── {doc_token}/
│       ├── payload.json
│       └── fetched_at.txt
├── normalized/
│   └── {doc_token}/
│       ├── content.md
│       ├── schema.json
│       └── meta.json
├── history/
│   └── {doc_token}/
│       ├── 2026-03-29T08-00-00Z.md
│       └── 2026-03-29T08-30-00Z.md
└── indexes/
    ├── docs.json
    ├── types.json
    └── changes.json
```

## 元数据模型

每个对象至少记录：
- `doc_token`
- `obj_type`
- `title`
- `parent_token`
- `source_update_time`
- `source_version`
- `content_hash`
- `schema_hash`
- `last_fetched_at`
- `last_archived_at`
- `local_paths`
- `status`

### 状态值
- `new`
- `updated`
- `unchanged`
- `deleted`
- `error`
- `unsupported`

## 变更判断

不要只靠时间。

建议使用三段式判断：
- 时间比对
- 内容 hash
- 结构 hash

### 判定规则
- 时间变了，但 hash 不变：假更新
- 时间没变，但 hash 变了：异常变更
- hash 变了：真实更新
- schema 变了：结构变更

## 限流与恢复

### 限流策略
- 请求队列化
- 按接口类型限速
- 429 后指数退避
- 必要时进入冷却期

### 恢复策略
- 文档级 checkpoint
- 任务级 checkpoint
- 失败重试上限
- 中断后可续跑

## 错误处理

### L1：单文档失败
- 记录错误
- 跳过当前对象
- 继续下一条

### L2：类型处理失败
- 标记该类型降级或不可用
- 不中断全局任务

### L3：来源接口失败
- 退避重试
- 进入冷却
- 防止限流放大

### L4：元数据写入失败
- 暂停提交
- 保留 raw 层
- 待恢复后重试

## 安全注意事项
- 仅执行单向归档
- 不向飞书回写
- token 不可明文暴露
- 本地目录权限应受控
- 日志需要脱敏

## 不做的事
- 不声明双向同步
- 不把所有类型强制转成同一种格式
- 不依赖单一时间戳判断变更
- 不把本地修改当成云端冲突解决方案

## 监控与报告
- 生成运行报告
- 记录 API 调用统计
- 记录失败原因
- 记录本地落盘路径
- 记录变更来源与 hash
