#!/bin/bash

# 数据库恢复脚本

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

# 检查参数
if [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [OPTIONS] BACKUP_FILE"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST     MySQL host (default: localhost)"
    echo "  -P, --port PORT     MySQL port (default: 3306)"
    echo "  -u, --user USER     MySQL user (default: roomx_user)"
    echo "  -p, --password PASS MySQL password (default: roomx_password)"
    echo "  -d, --database DB   Database name (default: roomx)"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backup.sql                                    # 恢复指定备份文件"
    echo "  $0 -h localhost -P 3306 -u root -p password backup.sql  # 自定义配置"
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
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# 检查备份文件
if [ -z "$BACKUP_FILE" ]; then
    log_error "Backup file is required!"
    echo "Usage: $0 [OPTIONS] BACKUP_FILE"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# 确认操作
log_warn "This will overwrite the existing database: $DATABASE"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Operation cancelled"
    exit 0
fi

# 执行恢复
log_info "Starting database restore..."
log_info "Host: $HOST:$PORT"
log_info "Database: $DATABASE"
log_info "User: $USER"
log_info "Backup file: $BACKUP_FILE"

# 删除并重新创建数据库
log_info "Dropping and recreating database..."
mysql -h"$HOST" -P"$PORT" -u"$USER" -p"$PASSWORD" -e "DROP DATABASE IF EXISTS $DATABASE;"
mysql -h"$HOST" -P"$PORT" -u"$USER" -p"$PASSWORD" -e "CREATE DATABASE $DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 恢复数据
if mysql -h"$HOST" -P"$PORT" -u"$USER" -p"$PASSWORD" "$DATABASE" < "$BACKUP_FILE"; then
    log_success "Database restore completed successfully!"
    log_info "Database: $DATABASE"
else
    log_error "Database restore failed!"
    exit 1
fi 