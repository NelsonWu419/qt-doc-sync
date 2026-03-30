#!/usr/bin/env bash
#
# qt-doc-sync Wrapper 脚本
# 用于 Cron 定时任务调用
#
# 用法：
#   ./sync-wrapper.sh
#   ./sync-wrapper.sh --batch-size 20
#   ./sync-wrapper.sh --target-dir /path/to/archive
#   ./sync-wrapper.sh --dry-run
#

set -euo pipefail

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 默认配置
TARGET_DIR="${TARGET_DIR:-$ROOT_DIR/company-docs/01-feishu-archive}"
BATCH_SIZE="${BATCH_SIZE:-20}"
DRY_RUN="${DRY_RUN:-false}"

# 日志函数
log_info() {
  echo "[INFO] $1"
}

log_error() {
  echo "[ERROR] $1" >&2
}

# 解析额外参数
EXTRA_ARGS=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      EXTRA_ARGS="$EXTRA_ARGS --dry-run"
      shift
      ;;
    --target-dir)
      TARGET_DIR="$2"
      shift 2
      ;;
    --batch-size)
      BATCH_SIZE="$2"
      shift 2
      ;;
    --help|-h)
      echo "用法：$0 [选项]"
      echo ""
      echo "选项:"
      echo "  --target-dir <path>    归档目标目录（默认：company-docs/01-飞书同步）"
      echo "  --batch-size <number>  每批次处理文档数量（默认：20）"
      echo "  --dry-run              空跑模式，不实际写入文件"
      echo "  --help, -h             显示帮助信息"
      exit 0
      ;;
    *)
      EXTRA_ARGS="$EXTRA_ARGS $1"
      shift
      ;;
  esac
done

# 输出配置
log_info "开始同步：$(date)"
log_info "目标目录：$TARGET_DIR"
log_info "批次大小：$BATCH_SIZE"
log_info "空跑模式：$DRY_RUN"

# 检查 sync-archive.js 是否存在
SYNC_SCRIPT="$SCRIPT_DIR/sync-archive.js"
if [[ ! -f "$SYNC_SCRIPT" ]]; then
  log_error "找不到同步脚本：$SYNC_SCRIPT"
  exit 1
fi

# 执行同步
node "$SYNC_SCRIPT" \
  --target-dir "$TARGET_DIR" \
  --batch-size "$BATCH_SIZE" \
  $EXTRA_ARGS

EXIT_CODE=$?

# 总结
if [[ $EXIT_CODE -eq 0 ]]; then
  log_info "同步完成：$(date)"
else
  log_error "同步失败：$(date)"
fi

exit $EXIT_CODE
