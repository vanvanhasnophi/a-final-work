#!/bin/bash

# 数据库备份脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 默认配置
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="roomx_backup_${DATE}.sql"

# 检查参数
if [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST     MySQL host (default: localhost)"
    echo "  -P, --port PORT     MySQL port (default: 3306)"
    echo "  -u, --user USER     MySQL user (default: roomx_user)"
    echo "  -p, --password PASS MySQL password (default: roomx_password)"
    echo "  -d, --database DB   Database name (default: roomx)"
    echo "  -o, --output FILE   Output file name"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # 使用默认配置备份"
    echo "  $0 -h localhost -P 3306 -u root -p password  # 自定义配置"
    exit 0
fi

# 解析参数
HOST="localhost"
PORT="3306"
USER="roomx_user"
PASSWORD="roomx_password"
DATABASE="roomx"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            HOST="$2"
            shift 2
            ;;
        -P|--port)
            PORT="$2"
            shift 2
            ;;
        -u|--user)
            USER="$2"
            shift 2
            ;;
        -p|--password)
            PASSWORD="$2"
            shift 2
            ;;
        -d|--database)
            DATABASE="$2"
            shift 2
            ;;
        -o|--output)
            BACKUP_FILE="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
log_info "Starting database backup..."
log_info "Host: $HOST:$PORT"
log_info "Database: $DATABASE"
log_info "User: $USER"
log_info "Output: $BACKUP_DIR/$BACKUP_FILE"

if mysqldump -h"$HOST" -P"$PORT" -u"$USER" -p"$PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DATABASE" > "$BACKUP_DIR/$BACKUP_FILE"; then
    log_success "Database backup completed successfully!"
    log_info "Backup file: $BACKUP_DIR/$BACKUP_FILE"
    
    # 显示文件大小
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    log_info "Backup size: $SIZE"
else
    log_error "Database backup failed!"
    exit 1
fi 