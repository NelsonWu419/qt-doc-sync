# qt-doc-sync

飞书文档单向归档 skill。

## 版本

- **v1.0.0**：架构闭环 + TDD 基础版
- **v1.1.0**：真实 Feishu Discovery / Fetcher 适配层，MVP 已完成

## 定位

- 只从飞书读取
- 只往本地写入
- 不回写云端
- 不做双向同步

## 设计目标

- 可信
- 可审计
- 可恢复
- 可扩展

## 适用对象

- doc / docx / wiki / mindnote
- sheet
- bitable

## 本地分层

- raw/
- normalized/
- history/
- meta/
- indexes/

## 当前状态

### 已完成（v1.1.0 MVP）
- discovery / diff / fetcher / normalizer / archiver / memory-sync / reporter / guard 基础骨架
- OpenClaw 真实工具桥接已接入
- `feishu_search_doc_wiki` → 文档发现
- `feishu_fetch_doc` → 正文抓取
- 仅保留正文类：doc / docx / wiki / mindnote
- 43 个测试通过
- 最小端到端链路可运行

### 已延期到后续版本
- sheet 真实接入
- bitable 真实接入
- 限流队列与 checkpoint 增强

## 后续建议

如果继续推进到真实可用版，优先补：
1. Feishu search → sourceItems
2. fetch-doc / sheet / bitable 真实抓取
3. hash 真实计算
4. checkpoint
5. 限流队列
