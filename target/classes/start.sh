#!/bin/bash

# RoomX Docker 启动脚本
echo "Starting RoomX Application in Docker..."

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 函数定义
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查环境变量
check_environment() {
    log_info "Checking environment variables..."
    
    # 设置默认值
    export SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-prod}
    export SERVER_PORT=${SERVER_PORT:-8080}
    export MYSQL_HOST=${MYSQL_HOST:-localhost}
    export MYSQL_PORT=${MYSQL_PORT:-3306}
    export MYSQL_DATABASE=${MYSQL_DATABASE:-roomx}
    export MYSQL_USER=${MYSQL_USER:-roomx_user}
    export MYSQL_PASSWORD=${MYSQL_PASSWORD:-roomx_password}
    export MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-root_password}
    
    log_success "Environment variables configured"
}

# 启动MySQL数据库
start_mysql() {
    log_info "Starting MySQL database..."
    
    # 检查MySQL是否已经运行
    if mysqladmin ping -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent 2>/dev/null; then
        log_success "MySQL is already running"
        return 0
    fi
    
    # 启动MySQL服务
    if command -v mysqld &> /dev/null; then
        log_info "Starting MySQL server..."
        mysqld --user=mysql --datadir=/var/lib/mysql &
        MYSQL_PID=$!
        
        # 等待MySQL启动
        local max_attempts=30
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if mysqladmin ping -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent 2>/dev/null; then
                log_success "MySQL started successfully"
                return 0
            fi
            
            log_info "Waiting for MySQL to start... (attempt $attempt/$max_attempts)"
            sleep 2
            attempt=$((attempt + 1))
        done
        
        log_error "MySQL failed to start within $((max_attempts * 2)) seconds"
        return 1
    else
        log_warn "MySQL server not found, assuming external MySQL"
        return 0
    fi
}

# 初始化数据库
init_database() {
    log_info "Initializing database..."
    
    # 等待MySQL启动
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1" 2>/dev/null; then
            log_success "Database connection established"
            break
        fi
        
        log_info "Waiting for database connection... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Failed to connect to database"
        return 1
    fi
    
    # 执行初始化脚本
    if [ -f "init.sql" ]; then
        log_info "Executing database initialization script..."
        mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < init.sql
        log_success "Database initialized successfully"
    else
        log_warn "No initialization script found"
    fi
}

# 启动Spring Boot应用
start_application() {
    log_info "Starting Spring Boot application..."
    
    # 设置JVM参数
    export JAVA_OPTS="${JAVA_OPTS:-"-Xmx512m -Xms256m"}"
    
    # 启动应用
    java $JAVA_OPTS -jar app.jar &
    APP_PID=$!
    
    # 等待应用启动
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:$SERVER_PORT/api/health >/dev/null 2>&1; then
            log_success "Application started successfully"
            return 0
        fi
        
        log_info "Waiting for application to start... (attempt $attempt/$max_attempts)"
        sleep 3
        attempt=$((attempt + 1))
    done
    
    log_error "Application failed to start within $((max_attempts * 3)) seconds"
    return 1
}

# 健康检查
health_check() {
    log_info "Performing health check..."
    
    # 检查应用健康状态
    if curl -f http://localhost:$SERVER_PORT/api/health >/dev/null 2>&1; then
        log_success "Application health check passed"
    else
        log_error "Application health check failed"
        return 1
    fi
    
    # 检查数据库连接
    if curl -f http://localhost:$SERVER_PORT/api/health/db >/dev/null 2>&1; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        return 1
    fi
}

# 信号处理
cleanup() {
    log_info "Shutting down services..."
    
    # 停止应用
    if [ -n "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
    fi
    
    # 停止MySQL
    if [ -n "$MYSQL_PID" ]; then
        kill $MYSQL_PID 2>/dev/null || true
    fi
    
    log_success "Services stopped"
    exit 0
}

# 设置信号处理
trap cleanup SIGTERM SIGINT

# 主函数
main() {
    log_info "Starting RoomX Application..."
    
    # 检查环境
    check_environment
    
    # 启动MySQL
    start_mysql
    
    # 初始化数据库
    init_database
    
    # 启动应用
    start_application
    
    # 健康检查
    health_check
    
    log_success "RoomX Application started successfully!"
    log_info "Application Information:"
    echo "  Backend API: http://localhost:$SERVER_PORT"
    echo "  Health Check: http://localhost:$SERVER_PORT/api/health"
    echo "  Database: $MYSQL_HOST:$MYSQL_PORT/$MYSQL_DATABASE"
    echo ""
    
    # 保持脚本运行
    while true; do
        sleep 10
        
        # 定期健康检查
        if ! curl -f http://localhost:$SERVER_PORT/api/health >/dev/null 2>&1; then
            log_error "Application health check failed, restarting..."
            start_application
        fi
    done
}

# 运行主函数
main "$@" 