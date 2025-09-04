#!/bin/bash

# FootPrint表迁移脚本
# 专门用于FootPrint表的创建和数据迁移

# 表名配置
OLD_TABLE_NAME="footprint_old"
NEW_TABLE_NAME="footprint"
TABLE_COMMENT="用户操作动态记录表"

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 配置文件路径
CONFIG_FILE="$SCRIPT_DIR/../db-config.properties"
MIGRATION_LOG="$SCRIPT_DIR/../../logs/migration.log"
BACKUP_DIR="$SCRIPT_DIR/../../backups/$(date +%Y%m%d_%H%M%S)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
    mkdir -p "$(dirname "$MIGRATION_LOG")"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$MIGRATION_LOG"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    mkdir -p "$(dirname "$MIGRATION_LOG")"
    echo "[ERROR] $1" >> "$MIGRATION_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
    mkdir -p "$(dirname "$MIGRATION_LOG")"
    echo "[SUCCESS] $1" >> "$MIGRATION_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    mkdir -p "$(dirname "$MIGRATION_LOG")"
    echo "[WARNING] $1" >> "$MIGRATION_LOG"
}

# 检查配置文件
check_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        error "配置文件不存在: $CONFIG_FILE"
        exit 1
    fi
    
    # 加载配置
    source "$CONFIG_FILE"
    
    # 验证必要配置
    if [[ -z "$DB_HOST" || -z "$DB_PORT" || -z "$DB_NAME" || -z "$DB_USER" || -z "$DB_PASSWORD" ]]; then
        error "配置文件缺少必要的数据库连接信息"
        exit 1
    fi
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

# 执行SQL语句
execute_sql() {
    local sql="$1"
    log "执行SQL: $sql"
    
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

# 创建FootPrint表
create_footprint_table() {
    local table_name="$1"
    
    local create_sql="
    CREATE TABLE IF NOT EXISTS $table_name (
        id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
        operator_id BIGINT COMMENT '操作人ID',
        user_id BIGINT COMMENT '目标用户ID（可选）',
        application_id BIGINT COMMENT '相关申请ID（可选）',
        room_id BIGINT COMMENT '相关房间ID（可选）',
        action VARCHAR(100) NOT NULL COMMENT '操作类型',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
        description TEXT COMMENT '操作描述',
        temp_info VARCHAR(1000) COMMENT '临时信息',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        
        INDEX idx_operator_id (operator_id),
        INDEX idx_user_id (user_id),
        INDEX idx_application_id (application_id),
        INDEX idx_room_id (room_id),
        INDEX idx_action (action),
        INDEX idx_timestamp (timestamp),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='$TABLE_COMMENT';
    "
    
    echo "$create_sql"
}

# FootPrint数据迁移
migrate_footprint_data() {
    local old_table="$1"
    local new_table="$2"
    
    # 检查旧表是否存在
    if ! table_exists "$old_table"; then
        log "旧表 $old_table 不存在，跳过数据迁移"
        return 0
    fi
    
    local old_count=$(get_table_count "$old_table")
    log "发现旧表 $old_table，包含 $old_count 条记录"
    
    if [[ "$old_count" -eq 0 ]]; then
        log "旧表无数据，跳过迁移"
        return 0
    fi
    
    # 数据迁移SQL - 根据旧表结构调整字段映射
    local migrate_sql="
    INSERT INTO $new_table (
        operator_id, user_id, application_id, room_id, 
        action, timestamp, description, temp_info
    )
    SELECT 
        COALESCE(operator_id, 0) as operator_id,
        user_id,
        application_id,
        room_id,
        COALESCE(action, 'unknown') as action,
        COALESCE(timestamp, NOW()) as timestamp,
        COALESCE(description, '') as description,
        COALESCE(temp_info, '') as temp_info
    FROM $old_table
    WHERE NOT EXISTS (
        SELECT 1 FROM $new_table n 
        WHERE n.operator_id = $old_table.operator_id 
        AND n.action = $old_table.action 
        AND ABS(TIMESTAMPDIFF(SECOND, n.timestamp, $old_table.timestamp)) < 1
    );
    "
    
    execute_sql "$migrate_sql"
    
    if [[ $? -eq 0 ]]; then
        local new_count=$(get_table_count "$new_table")
        success "FootPrint数据迁移成功，新表包含 $new_count 条记录"
        return 0
    else
        error "FootPrint数据迁移失败"
        return 1
    fi
}

# FootPrint表结构更新
update_footprint_structure() {
    local table_name="$1"
    
    # 检查temp_info字段
    local has_temp_info=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$DB_NAME' AND table_name='$table_name' AND column_name='temp_info';" -N 2>/dev/null)
    
    if [[ "$has_temp_info" == "0" ]]; then
        log "添加temp_info字段到FootPrint表"
        execute_sql "ALTER TABLE $table_name ADD COLUMN temp_info VARCHAR(1000) COMMENT '临时信息' AFTER description;"
        success "temp_info字段添加成功"
    fi
    
    # 检查索引
    local has_action_index=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
        -e "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema='$DB_NAME' AND table_name='$table_name' AND index_name='idx_action';" -N 2>/dev/null)
    
    if [[ "$has_action_index" == "0" ]]; then
        log "添加action字段索引"
        execute_sql "ALTER TABLE $table_name ADD INDEX idx_action (action);"
        success "action索引添加成功"
    fi
    
    log "FootPrint表结构更新检查完成"
}

# 主迁移函数
migrate_footprint_table() {
    log "开始迁移FootPrint表..."
    
    # 检查是否需要迁移
    if table_exists "$NEW_TABLE_NAME"; then
        local count=$(get_table_count "$NEW_TABLE_NAME")
        if [[ "$count" -gt 0 ]]; then
            warning "FootPrint表已存在且有数据($count条)，跳过迁移"
            warning "如需强制迁移，请先备份数据并手动删除表"
            return 0
        fi
    fi
    
    # 创建新表
    local create_sql=$(create_footprint_table "$NEW_TABLE_NAME")
    execute_sql "$create_sql"
    
    if [[ $? -ne 0 ]]; then
        error "创建FootPrint表失败"
        return 1
    fi
    
    success "FootPrint表创建成功"
    
    # 迁移数据
    migrate_footprint_data "$OLD_TABLE_NAME" "$NEW_TABLE_NAME"
    
    # 更新表结构
    update_footprint_structure "$NEW_TABLE_NAME"
    
    success "FootPrint表迁移完成"
    
    # 显示迁移结果
    local final_count=$(get_table_count "$NEW_TABLE_NAME")
    log "FootPrint表最终包含 $final_count 条记录"
}

# 如果直接执行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    log "开始FootPrint专用迁移..."
    
    # 检查配置和连接
    check_config
    test_connection
    
    # 执行迁移
    migrate_footprint_table
    
    success "FootPrint专用迁移完成"
fi
