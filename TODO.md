# qt-doc-sync TODO

## P1 任务状态（v1.1.0 增强版）

### 已完成 ✅
1. **CLI 参数化**
   - `--target-dir <path>` - 自定义归档目录
   - `--batch-size <number>` - 批次处理数量
   - `--dry-run` - 空跑模式
   - `--help` - 帮助信息

2. **增量同步做实**
   - `src/diff/computeContentHash` - 真实内容 hash 计算
   - `src/diff/stableStringify` - 稳定序列化
   - 假更新识别（hash 不变则跳过）

3. **历史版本落盘**
   - `src/archiver/writeHistorySnapshot` - 按时间戳写快照
   - 保留变更前后对照

4. **限流队列增强**
   - `src/guard/isRateLimitError` - 429 错误识别
   - `src/guard/getRetryDelayMs` - 指数退避计算
   - 支持 `retryAfter` 字段

5. **checkpoint / 断点恢复**
   - manifest 中添加 `checkpoint` 字段
   - 记录最近归档位置和历史路径

---

## 已延期到后续版本

- sheet 真实接入
- bitable 真实接入
- sheet / bitable 数据结构归档
- 更完整的 CLI 参数体系
- 更完整的可观测性与审计报表

---

## v1.1.0 状态

**P1 任务已全部完成。**  
**测试覆盖：45 / 45 通过**

准备发布 v1.1.0。
