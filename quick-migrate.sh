#!/bin/bash

# 数据库快速迁移启动脚本
# 提供简单的交互式界面

set -e

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_SCRIPT="$SCRIPT_DIR/scripts/db-migration.sh"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 显示标题
show_title() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    数据库迁移工具                            ║"
    echo "║                Database Migration Tool                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 显示菜单
show_menu() {
    echo -e "${BLUE}请选择操作:${NC}"
    echo "1. 🔄 完整迁移 (推荐)"
    echo "2. 📋 FootPrint表迁移"
    echo "3. 👥 用户表结构更新"
    echo "4. 🏠 房间表结构更新"
    echo "5. 📝 申请表结构更新"
    echo "6. 💾 仅创建备份"
    echo "7. 🧪 试运行模式"
    echo "8. ⚙️  配置管理"
    echo "9. 📊 状态检查"
    echo "0. 🚪 退出"
    echo
}

# 显示配置信息
show_config() {
    local config_file="$SCRIPT_DIR/scripts/db-config.properties"
    
    if [[ -f "$config_file" ]]; then
        echo -e "${YELLOW}当前配置:${NC}"
        source "$config_file"
        echo "  数据库主机: $DB_HOST:$DB_PORT"
        echo "  数据库名称: $DB_NAME"
        echo "  用户名: $DB_USER"
        echo "  备份启用: $BACKUP_ENABLED"
        echo "  备份保留天数: $BACKUP_RETENTION_DAYS"
    else
        echo -e "${RED}配置文件不存在，将使用默认配置${NC}"
    fi
    echo
}

# 检查数据库连接
check_database() {
    echo -e "${BLUE}检查数据库连接...${NC}"
    
    if bash "$MIGRATION_SCRIPT" --help > /dev/null 2>&1; then
        # 测试连接
        if timeout 10 bash -c "source $SCRIPT_DIR/scripts/db-config.properties && mysql -h\$DB_HOST -P\$DB_PORT -u\$DB_USER -p\$DB_PASSWORD -e 'SELECT 1;' > /dev/null 2>&1"; then
            echo -e "${GREEN}✓ 数据库连接正常${NC}"
        else
            echo -e "${RED}✗ 数据库连接失败${NC}"
            echo -e "${YELLOW}请检查配置文件中的数据库连接信息${NC}"
        fi
    else
        echo -e "${RED}✗ 迁移脚本不可用${NC}"
    fi
    echo
}

# 显示表状态
show_table_status() {
    echo -e "${BLUE}检查表状态...${NC}"
    
    local config_file="$SCRIPT_DIR/scripts/db-config.properties"
    if [[ -f "$config_file" ]]; then
        source "$config_file"
        
        local tables=("user" "room" "application" "footprint")
        
        for table in "${tables[@]}"; do
            local count=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
                -e "SELECT COUNT(*) FROM $table;" -N 2>/dev/null || echo "N/A")
            
            if [[ "$count" == "N/A" ]]; then
                echo -e "  $table: ${RED}不存在${NC}"
            else
                echo -e "  $table: ${GREEN}$count 条记录${NC}"
            fi
        done
    fi
    echo
}

# 编辑配置
edit_config() {
    local config_file="$SCRIPT_DIR/scripts/db-config.properties"
    
    echo -e "${YELLOW}配置管理${NC}"
    echo "1. 查看配置"
    echo "2. 编辑配置"
    echo "3. 重置为默认配置"
    echo "0. 返回主菜单"
    echo
    
    read -p "请选择: " config_choice
    
    case $config_choice in
        1)
            if [[ -f "$config_file" ]]; then
                echo -e "${BLUE}当前配置内容:${NC}"
                cat "$config_file"
            else
                echo -e "${RED}配置文件不存在${NC}"
            fi
            ;;
        2)
            if command -v nano > /dev/null; then
                nano "$config_file"
            elif command -v vim > /dev/null; then
                vim "$config_file"
            else
                echo -e "${RED}未找到可用的编辑器${NC}"
            fi
            ;;
        3)
            bash "$MIGRATION_SCRIPT" --help > /dev/null  # 触发默认配置创建
            echo -e "${GREEN}配置已重置为默认值${NC}"
            ;;
        0)
            return
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            ;;
    esac
    
    echo
    read -p "按回车键继续..."
}

# 执行迁移
run_migration() {
    local args="$1"
    
    echo -e "${BLUE}开始执行迁移...${NC}"
    echo -e "${YELLOW}执行命令: bash $MIGRATION_SCRIPT $args${NC}"
    echo
    
    # 确认执行
    read -p "确认执行吗? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bash "$MIGRATION_SCRIPT" $args
        local result=$?
        
        if [[ $result -eq 0 ]]; then
            echo
            echo -e "${GREEN}✓ 迁移执行完成${NC}"
        else
            echo
            echo -e "${RED}✗ 迁移执行失败 (退出码: $result)${NC}"
        fi
    else
        echo -e "${YELLOW}操作已取消${NC}"
    fi
    
    echo
    read -p "按回车键继续..."
}

# 主循环
main() {
    while true; do
        show_title
        show_config
        show_menu
        
        read -p "请输入选择 [0-9]: " choice
        echo
        
        case $choice in
            1)
                run_migration ""
                ;;
            2)
                run_migration "-t footprint"
                ;;
            3)
                run_migration "-t user"
                ;;
            4)
                run_migration "-t room"
                ;;
            5)
                run_migration "-t application"
                ;;
            6)
                run_migration "--backup-only"
                ;;
            7)
                run_migration "-d"
                ;;
            8)
                edit_config
                ;;
            9)
                check_database
                show_table_status
                read -p "按回车键继续..."
                ;;
            0)
                echo -e "${GREEN}再见!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选择，请输入 0-9${NC}"
                sleep 1
                ;;
        esac
    done
}

# 检查依赖
check_dependencies() {
    local missing_deps=()
    
    if ! command -v mysql > /dev/null; then
        missing_deps+=("mysql")
    fi
    
    if ! command -v mysqldump > /dev/null; then
        missing_deps+=("mysqldump")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo -e "${RED}缺少必要的依赖: ${missing_deps[*]}${NC}"
        echo "请安装MySQL客户端工具"
        exit 1
    fi
}

# 启动
echo -e "${BLUE}初始化数据库迁移工具...${NC}"
check_dependencies

# 确保迁移脚本可执行
chmod +x "$MIGRATION_SCRIPT" 2>/dev/null

# 启动主程序
main
