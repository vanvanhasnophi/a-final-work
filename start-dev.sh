#!/bin/bash

# RoomX 本地开发环境启动脚本
echo "Starting RoomX Application in Development Mode..."

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

# 显示帮助信息
show_help() {
    echo "RoomX Development Environment Startup Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help        Show this help message"
    echo "  --skip-build      Skip Maven build step"
    echo "  --redis           Force enable Redis (override env)"
    echo "  --no-redis        Force disable Redis for this run"
    echo ""
    echo "Environment Variables:"
    echo "  REDIS_ENABLED=true|false   Default Redis toggle (overridden by CLI flags)"
    echo ""
    echo "Database Setup Instructions:"
    echo "  1. Install MySQL:"
    echo "     - macOS: brew install mysql"
    echo "     - Ubuntu: sudo apt install mysql-server"
    echo "     - Windows: Download from mysql.com"
    echo ""
    echo "  2. Start MySQL service:"
    echo "     - macOS: brew services start mysql"
    echo "     - Ubuntu: sudo systemctl start mysql"
    echo "     - Windows: Start MySQL service"
    echo ""
    echo "  3. Create database:"
    echo "     mysql -u root -p -e 'CREATE DATABASE roomx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'"
    echo ""
    echo "  4. Verify connection:"
    echo "     mysql -u root -p -e 'USE roomx; SHOW TABLES;'"
    echo ""
}

# 解析命令行参数
parse_args() {
    SKIP_BUILD=false
    # inherit env; default false
    USE_REDIS=${REDIS_ENABLED:-false}
    FORCE_REDIS_SET=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --redis)
                USE_REDIS=true
                FORCE_REDIS_SET=true
                shift
                ;;
            --no-redis)
                USE_REDIS=false
                FORCE_REDIS_SET=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # If env provided and no explicit flag, honor env value
    if [[ "$FORCE_REDIS_SET" = false && -n "$REDIS_ENABLED" ]]; then
        USE_REDIS=$REDIS_ENABLED
    fi

    export USE_REDIS
}

# 检查Java环境
check_java() {
    log_info "Checking Java environment..."
    
    if ! command -v java &> /dev/null; then
        log_error "Java is not installed or not in PATH"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    log_success "Java version: $JAVA_VERSION"
}

# 检查Maven环境
check_maven() {
    log_info "Checking Maven environment..."
    
    if ! command -v mvn &> /dev/null; then
        log_error "Maven is not installed or not in PATH"
        exit 1
    fi
    
    MAVEN_VERSION=$(mvn -version 2>&1 | head -n 1)
    log_success "Maven: $MAVEN_VERSION"
}

# 检查Node.js环境
check_node() {
    log_info "Checking Node.js environment..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed or not in PATH"
        log_info "Please install Node.js:"
        echo "  - macOS: brew install node"
        echo "  - Ubuntu: sudo apt install nodejs npm"
        echo "  - Windows: Download from nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_success "Node.js version: $NODE_VERSION"
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    log_success "npm version: $NPM_VERSION"
}

# 检查MySQL连接
check_mysql() {
    log_info "Checking MySQL connection..."
    
    # 检查MySQL服务是否运行（通过端口检查）
    if command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":3306 "; then
            log_success "MySQL port 3306 is listening"
        else
            log_warn "MySQL port 3306 is not listening"
            log_info "Please ensure MySQL service is running:"
            echo "  - macOS: brew services start mysql"
            echo "  - Ubuntu: sudo systemctl start mysql"
            echo "  - Windows: Start MySQL service"
        fi
    elif command -v lsof &> /dev/null; then
        if lsof -i :3306 2>/dev/null | grep -q "LISTEN"; then
            log_success "MySQL port 3306 is listening"
        else
            log_warn "MySQL port 3306 is not listening"
        fi
    else
        log_warn "Cannot check MySQL port status, assuming MySQL is running"
    fi
    
    # 检查数据库文件是否存在（可选）
    if [ -d "/usr/local/var/mysql" ] || [ -d "/var/lib/mysql" ] || [ -d "/opt/homebrew/var/mysql" ]; then
        log_success "MySQL data directory found"
    else
        log_warn "MySQL data directory not found in common locations"
    fi
    
    log_info "Database connection will be tested when application starts"
    return 0
}

# 检查数据库配置
check_database_config() {
    log_info "Checking database configuration..."
    
    # 检查配置文件
    if [ -f "src/main/resources/application-dev.yml" ]; then
        log_success "Development configuration file found"
    else
        log_error "Development configuration file not found"
        return 1
    fi
    
    # 检查数据库URL配置
    if grep -q "localhost:3306/roomx" src/main/resources/application-dev.yml; then
        log_success "Database URL configured correctly"
    else
        log_warn "Database URL may not be configured correctly"
    fi
    
    # 检查用户名配置
    if grep -q "username: root" src/main/resources/application-dev.yml; then
        log_success "Database username configured"
    else
        log_warn "Database username may not be configured correctly"
    fi
    
    return 0
}

# 检查Redis连接
check_redis() {
    if [[ "$USE_REDIS" != true ]]; then
        log_info "Redis disabled (--no-redis or default). Skipping Redis port check."
        return 0
    fi
    log_info "Checking Redis connection (enabled)..."
    if command -v nc >/dev/null 2>&1; then
        if nc -z localhost 6379 >/dev/null 2>&1; then
            log_success "Redis port 6379 is listening"
        else
            log_warn "Redis port 6379 not listening; application will attempt to connect and may log warnings."
        fi
    else
        if command -v lsof >/dev/null 2>&1 && lsof -i :6379 2>/dev/null | grep -q LISTEN; then
            log_success "Redis port 6379 is listening"
        else
            log_warn "Redis port 6379 status unknown (nc not installed)."
        fi
    fi
    return 0
}

# 编译项目
build_project() {
    if [ "$SKIP_BUILD" = true ]; then
        log_info "Skipping Maven build as requested"
        return 0
    fi
    
    log_info "Building project with Maven..."
    
    # 清理并编译
    mvn clean compile -q
    log_success "Project compiled successfully"
}

# 安装前端依赖
install_frontend_deps() {
    log_info "Installing frontend dependencies..."
    
    cd src/frontend
    
    # 检查node_modules是否存在
    if [ ! -d "node_modules" ]; then
        log_info "Installing npm dependencies..."
        npm install --silent
    else
        log_info "Checking for dependency updates..."
        npm install --silent
    fi
    
    log_success "Frontend dependencies installed"
    cd ../..
}

# 启动前端应用
start_frontend() {
    log_info "Starting frontend application..."
    
    cd src/frontend
    
    # 启动React开发服务器
    npm start &
    FRONTEND_PID=$!
    
    # 等待前端启动
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            log_success "Frontend started successfully"
            cd ../..
            return 0
        fi
        
        # 检查前端进程是否还在运行
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            log_error "Frontend process died unexpectedly"
            cd ../..
            return 1
        fi
        
        log_info "Waiting for frontend to start... (attempt $attempt/$max_attempts)"
        sleep 3
        attempt=$((attempt + 1))
    done
    
    log_error "Frontend failed to start within $((max_attempts * 3)) seconds"
    cd ../..
    return 1
}

# 启动应用
start_application() {
    log_info "Starting Spring Boot application in development mode..."
    
    # 设置环境变量
    export SPRING_PROFILES_ACTIVE=dev
    export SERVER_PORT=8080
    
    if [[ "$USE_REDIS" = true ]]; then
        export REDIS_ENABLED=true
        log_info "Backend will start WITH Redis (REDIS_ENABLED=true)."
        JVM_REDIS_ARGS="-Dmanagement.health.redis.enabled=true"
    else
        export REDIS_ENABLED=false
        log_info "Backend will start WITHOUT Redis (REDIS_ENABLED=false)."
        # 禁用 Redis 自动配置与健康检查，避免连接被拒绝异常
        JVM_REDIS_ARGS="-Dmanagement.health.redis.enabled=false -Dspring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
    fi
    
    # 启动应用
    mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.jvmArguments="$JVM_REDIS_ARGS" &
    APP_PID=$!
    
    # 等待应用启动
    local max_attempts=90  # 增加等待时间
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
            log_success "Application started successfully"
            return 0
        fi
        
        # 检查应用是否还在运行
        if ! kill -0 $APP_PID 2>/dev/null; then
            log_error "Application process died unexpectedly"
            return 1
        fi
        
        log_info "Waiting for application to start... (attempt $attempt/$max_attempts)"
        sleep 3
        attempt=$((attempt + 1))
    done
    
    log_error "Application failed to start within $((max_attempts * 3)) seconds"
    log_info "Checking application logs for errors..."
    
    # 尝试获取应用日志
    if [ -f "target/spring-boot.log" ]; then
        log_info "Recent application logs:"
        tail -20 target/spring-boot.log
    fi
    
    return 1
}

# 健康检查
health_check() {
    log_info "Performing health check..."
    
    # 检查后端健康状态
    if curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # 检查前端健康状态
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
}

# 信号处理
cleanup() {
    log_info "Shutting down applications..."
    
    # 停止后端应用
    if [ -n "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
    fi
    
    # 停止前端应用
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        wait $FRONTEND_PID 2>/dev/null || true
    fi
    
    log_success "Applications stopped"
    exit 0
}

# 设置信号处理
trap cleanup SIGTERM SIGINT

# 主函数
main() {
    # 解析命令行参数
    parse_args "$@"
    
    log_info "Starting RoomX Development Environment..."
    
    # 检查环境
    check_java
    check_maven
    check_node
    check_mysql
    check_database_config
    check_redis
    
    # 编译项目
    build_project
    
    # 安装前端依赖
    install_frontend_deps
    
    # 启动后端应用
    start_application
    
    # 启动前端应用
    start_frontend
    
    # 健康检查
    health_check
    
    log_success "RoomX Development Environment started successfully!"
    log_info "Application Information:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8080"
    echo "  Health Check: http://localhost:8080/api/health"
    echo "  Database: localhost:3306/roomx"
    echo "  Profile: dev"
    echo ""
    echo "Press Ctrl+C to stop the applications"
    
    # 保持脚本运行
    wait $APP_PID $FRONTEND_PID
}

# 运行主函数
main "$@"