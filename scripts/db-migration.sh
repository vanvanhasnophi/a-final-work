#!/bin/bash

# 数据库迁移工具
# 用于在业务结构更新时无损迁移旧表数据到新表结构

set -e

# 配置文件路径
CONFIG_FILE="./scripts/db-config.properties"
MIGRATION_LOG="./logs/migration.log"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$MIGRATION_LOG"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    echo "[ERROR] $1" >> "$MIGRATION_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
    echo "[SUCCESS] $1" >> "$MIGRATION_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    echo "[WARNING] $1" >> "$MIGRATION_LOG"
}

# 检查配置文件
check_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        error "配置文件不存在: $CONFIG_FILE"
        log "创建默认配置文件..."
        create_default_config
    fi
    
    # 加载配置
    source "$CONFIG_FILE"
    
    # 验证必要配置
    if [[ -z "$DB_HOST" || -z "$DB_PORT" || -z "$DB_NAME" || -z "$DB_USER" || -z "$DB_PASSWORD" ]]; then
        error "配置文件缺少必要的数据库连接信息"
        exit 1
    fi
}

# 创建默认配置文件
create_default_config() {
    mkdir -p "$(dirname "$CONFIG_FILE")"
    cat > "$CONFIG_FILE" << 'EOF'
# 数据库连接配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=roomx
DB_USER=root
DB_PASSWORD=515155Xxx

# 备份配置
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30

# 迁移配置
DRY_RUN=false
FORCE_MIGRATION=false
EOF
    log "已创建默认配置文件: $CONFIG_FILE"
    log "请根据实际情况修改数据库连接信息"
}

# 数据库连接测试
test_connection() {
    log "测试数据库连接..."
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" > /dev/null 2>&1
    if [[ $? -eq 0 ]]; then
        success "数据库连接成功"
    else
        error "数据库连接失败，请检查配置"
        exit 1
    fi
}

# 创建备份
create_backup() {
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        log "创建数据库备份..."
        mkdir -p "$BACKUP_DIR"
        
        mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" \
            --single-transaction --routines --triggers "$DB_NAME" > "$BACKUP_DIR/backup.sql"
        
        if [[ $? -eq 0 ]]; then
            success "备份创建成功: $BACKUP_DIR/backup.sql"
        else
            error "备份创建失败"
            exit 1
        fi
    else
        warning "备份功能已禁用"
    fi
}

# 执行SQL文件
execute_sql_file() {
    local sql_file="$1"
    log "执行SQL文件: $sql_file"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warning "DRY RUN模式 - 不会实际执行SQL"
        cat "$sql_file"
        return 0
    fi
    
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$sql_file"
    return $?
}

# 执行单条SQL语句
execute_sql() {
    local sql="$1"
    log "执行SQL: $sql"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warning "DRY RUN模式 - 不会实际执行SQL"
        echo "$sql"
        return 0
    fi
    
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "$sql"
    return $?
}

# 检查表是否存在
table_exists() {
    local table_name="$1"
    local result=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME' AND table_name='$table_name';" \
        -N 2>/dev/null)
    [[ "$result" == "1" ]]
}

# 获取表的记录数
get_table_count() {
    local table_name="$1"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SELECT COUNT(*) FROM $table_name;" -N 2>/dev/null || echo "0"
}

# FootPrint表迁移 - 调用专用脚本
migrate_footprint_table() {
    log "开始迁移FootPrint表..."
    
    local footprint_script="$(dirname "$0")/migrations/migrate_footprint.sh"
    
    if [[ -f "$footprint_script" ]]; then
        log "调用专用FootPrint迁移脚本..."
        bash "$footprint_script"
        return $?
    else
        error "找不到FootPrint专用迁移脚本: $footprint_script"
        return 1
    fi
}

# 用户表结构更新
migrate_user_table() {
    log "检查用户表结构更新..."
    
    local table="user"
    
    # 检查是否需要添加新字段
    local has_created_at=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$DB_NAME' AND table_name='$table' AND column_name='created_at';" -N 2>/dev/null)
    
    if [[ "$has_created_at" == "0" ]]; then
        log "添加created_at字段到用户表"
        execute_sql "ALTER TABLE $table ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
        execute_sql "ALTER TABLE $table ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;"
        success "用户表字段添加完成"
    fi
}

# 房间表结构更新
migrate_room_table() {
    log "检查房间表结构更新..."
    
    local table="room"
    
    # 检查是否需要添加新字段（例如房间状态历史）
    local has_status_history=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$DB_NAME' AND table_name='$table' AND column_name='status_history';" -N 2>/dev/null)
    
    if [[ "$has_status_history" == "0" ]]; then
        log "添加status_history字段到房间表"
        execute_sql "ALTER TABLE $table ADD COLUMN status_history TEXT COMMENT '状态变更历史(JSON格式)';"
        success "房间表字段添加完成"
    fi
}

# 申请表结构更新
migrate_application_table() {
    log "检查申请表结构更新..."
    
    local table="application"
    
    # 检查expired字段
    local has_expired=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$DB_NAME' AND table_name='$table' AND column_name='expired';" -N 2>/dev/null)
    
    if [[ "$has_expired" == "0" ]]; then
        log "添加expired字段到申请表"
        execute_sql "ALTER TABLE $table ADD COLUMN expired BOOLEAN DEFAULT FALSE COMMENT '是否已过期';"
        success "申请表expired字段添加完成"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    if [[ "$BACKUP_ENABLED" == "true" && -n "$BACKUP_RETENTION_DAYS" ]]; then
        log "清理超过 $BACKUP_RETENTION_DAYS 天的旧备份..."
        find "./backups" -name "20*" -type d -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null
        success "旧备份清理完成"
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
数据库迁移工具

用法: $0 [选项]

选项:
    -h, --help          显示此帮助信息
    -c, --config FILE   指定配置文件路径 (默认: ./scripts/db-config.properties)
    -d, --dry-run       试运行模式，不实际执行SQL
    -f, --force         强制迁移，即使目标表已有数据
    -t, --table TABLE   只迁移指定的表 (footprint|user|room|application|all)
    --no-backup         禁用备份
    --backup-only       只创建备份，不执行迁移

示例:
    $0                          # 执行完整迁移
    $0 -d                       # 试运行模式
    $0 -t footprint             # 只迁移FootPrint表
    $0 -f                       # 强制迁移所有表
    $0 --backup-only            # 只创建备份
EOF
}

# 主函数
main() {
    local target_table="all"
    local backup_only=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE_MIGRATION=true
                shift
                ;;
            -t|--table)
                target_table="$2"
                shift 2
                ;;
            --no-backup)
                BACKUP_ENABLED=false
                shift
                ;;
            --backup-only)
                backup_only=true
                shift
                ;;
            *)
                error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 初始化
    mkdir -p "$(dirname "$MIGRATION_LOG")"
    log "开始数据库迁移 - $(date)"
    
    # 检查配置
    check_config
    
    # 测试连接
    test_connection
    
    # 创建备份
    create_backup
    
    if [[ "$backup_only" == "true" ]]; then
        success "仅备份模式完成"
        exit 0
    fi
    
    # 执行迁移
    case "$target_table" in
        footprint)
            migrate_footprint_table
            ;;
        user)
            migrate_user_table
            ;;
        room)
            migrate_room_table
            ;;
        application)
            migrate_application_table
            ;;
        all)
            migrate_footprint_table
            migrate_user_table
            migrate_room_table
            migrate_application_table
            ;;
        *)
            error "不支持的表名: $target_table"
            exit 1
            ;;
    esac
    
    # 清理旧备份
    cleanup_old_backups
    
    success "数据库迁移完成 - $(date)"
}

# 执行主函数
main "$@"
