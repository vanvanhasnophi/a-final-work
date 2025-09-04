#!/bin/bash

# 新表迁移模板
# 使用方法: 复制此文件并重命名为具体的表名，如 migrate_footprint.sh

# 表名配置
OLD_TABLE_NAME=""      # 旧表名（如果存在）
NEW_TABLE_NAME=""      # 新表名
TABLE_COMMENT=""       # 表注释

# 创建新表的SQL语句
create_new_table() {
    local table_name="$1"
    
    # 在这里定义新表的结构
    local create_sql="
    CREATE TABLE IF NOT EXISTS $table_name (
        id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
        -- 在这里添加表字段定义
        -- 示例:
        -- name VARCHAR(255) NOT NULL COMMENT '名称',
        -- status TINYINT DEFAULT 1 COMMENT '状态',
        -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        -- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        
        -- 在这里添加索引定义
        -- INDEX idx_name (name),
        -- INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='$TABLE_COMMENT';
    "
    
    echo "$create_sql"
}

# 数据迁移逻辑
migrate_data() {
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
    
    # 在这里定义数据迁移的SQL
    # 注意：需要根据实际的字段映射关系调整
    local migrate_sql="
    INSERT INTO $new_table (
        -- 列出新表的字段
        -- id, name, status, created_at, updated_at
    )
    SELECT 
        -- 映射旧表的字段到新表
        -- old_id, old_name, old_status, old_created_time, old_updated_time
    FROM $old_table
    WHERE NOT EXISTS (
        SELECT 1 FROM $new_table n 
        WHERE n.id = $old_table.old_id  -- 根据实际情况调整去重条件
    );
    "
    
    execute_sql "$migrate_sql"
    
    if [[ $? -eq 0 ]]; then
        local new_count=$(get_table_count "$new_table")
        success "数据迁移成功，新表包含 $new_count 条记录"
        return 0
    else
        error "数据迁移失败"
        return 1
    fi
}

# 表结构更新
update_table_structure() {
    local table_name="$1"
    
    # 检查并添加新字段
    # 示例：
    # local has_new_field=$(mysql ... -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$DB_NAME' AND table_name='$table_name' AND column_name='new_field';" -N 2>/dev/null)
    # 
    # if [[ "$has_new_field" == "0" ]]; then
    #     log "添加new_field字段到$table_name表"
    #     execute_sql "ALTER TABLE $table_name ADD COLUMN new_field VARCHAR(255) DEFAULT NULL COMMENT '新字段';"
    # fi
    
    log "表结构更新检查完成: $table_name"
}

# 主迁移函数
migrate_table() {
    if [[ -z "$NEW_TABLE_NAME" ]]; then
        error "请设置NEW_TABLE_NAME变量"
        return 1
    fi
    
    log "开始迁移表: $NEW_TABLE_NAME"
    
    # 创建新表
    local create_sql=$(create_new_table "$NEW_TABLE_NAME")
    execute_sql "$create_sql"
    
    if [[ $? -ne 0 ]]; then
        error "创建表失败: $NEW_TABLE_NAME"
        return 1
    fi
    
    success "表创建成功: $NEW_TABLE_NAME"
    
    # 迁移数据（如果有旧表）
    if [[ -n "$OLD_TABLE_NAME" ]]; then
        migrate_data "$OLD_TABLE_NAME" "$NEW_TABLE_NAME"
    fi
    
    # 更新表结构
    update_table_structure "$NEW_TABLE_NAME"
    
    success "表迁移完成: $NEW_TABLE_NAME"
}

# 如果直接执行此脚本（而不是被引用），则运行迁移
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # 加载主迁移脚本的函数
    source "$(dirname "$0")/db-migration.sh"
    
    # 执行表迁移
    migrate_table
fi
