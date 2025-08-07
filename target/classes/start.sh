#!/bin/bash

# RoomX Docker 环境启动脚本
echo "Starting RoomX Application in Docker Environment..."

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
    log_info "Checking Docker environment variables..."
    
    # 设置默认值
    export SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-prod}
    export SERVER_PORT=${SERVER_PORT:-8080}
    export MYSQL_HOST=${MYSQL_HOST:-roomx-db}
    export MYSQL_PORT=${MYSQL_PORT:-3306}
    export MYSQL_DATABASE=${MYSQL_DATABASE:-roomx}
    export MYSQL_USER=${MYSQL_USER:-roomx_user}
    export MYSQL_PASSWORD=${MYSQL_PASSWORD:-roomx_password}
    export MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-root_password}
    export JAVA_OPTS=${JAVA_OPTS:-"-Xmx512m -Xms256m"}
    
    log_success "Docker environment variables configured"
    log_info "  Profile: $SPRING_PROFILES_ACTIVE"
    log_info "  Database: $MYSQL_HOST:$MYSQL_PORT/$MYSQL_DATABASE"
    log_info "  JVM Options: $JAVA_OPTS"
}

# 等待数据库启动
wait_for_database() {
    log_info "Waiting for database to be ready..."
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if mysqladmin ping -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent 2>/dev/null; then
            log_success "Database is ready"
            return 0
        fi
        
        log_info "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Database failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# 初始化数据库
init_database() {
    log_info "Initializing database..."
    
    # 等待数据库启动
    wait_for_database
    
    # 检查数据库是否已初始化
    if mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DATABASE; SHOW TABLES;" 2>/dev/null | grep -q "user"; then
        log_success "Database already initialized"
        return 0
    fi
    
    # 执行初始化脚本
    if [ -f "init.sql" ]; then
        log_info "Executing database initialization script..."
        mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < init.sql
        log_success "Database initialized successfully"
    else
        log_warn "No initialization script found, database will be auto-created by JPA"
    fi
}

# 启动Spring Boot应用
start_application() {
    log_info "Starting Spring Boot application in Docker mode..."
    
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
}

# 信号处理
cleanup() {
    log_info "Shutting down application..."
    
    # 停止应用
    if [ -n "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
    fi
    
    log_success "Application stopped"
    exit 0
}

# 设置信号处理
trap cleanup SIGTERM SIGINT

# 主函数
main() {
    log_info "Starting RoomX Docker Environment..."
    
    # 检查环境
    check_environment
    
    # 初始化数据库
    init_database
    
    # 启动应用
    start_application
    
    # 健康检查
    health_check
    
    log_success "RoomX Docker Environment started successfully!"
    log_info "Application Information:"
    echo "  Backend API: http://localhost:$SERVER_PORT"
    echo "  Health Check: http://localhost:$SERVER_PORT/api/health"
    echo "  Database: $MYSQL_HOST:$MYSQL_PORT/$MYSQL_DATABASE"
    echo "  Profile: $SPRING_PROFILES_ACTIVE"
    echo ""
    
    # 保持脚本运行并定期健康检查
    while true; do
        sleep 30
        
        # 定期健康检查
        if ! curl -f http://localhost:$SERVER_PORT/api/health >/dev/null 2>&1; then
            log_error "Application health check failed, restarting..."
            start_application
        fi
    done
}

# 运行主函数
main "$@" 