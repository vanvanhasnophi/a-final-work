#!/bin/bash

# RoomX Redis 快速启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

show_help() {
    echo "RoomX Redis 管理脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  start-dev       启动开发环境（内存缓存）"
    echo "  start-redis     启动开发环境（Redis缓存）"  
    echo "  start-prod      启动生产环境（完整Docker）"
    echo "  stop            停止所有服务"
    echo "  status          查看服务状态"
    echo "  redis-cli       连接Redis客户端"
    echo "  test-redis      测试Redis连接"
    echo "  clean           清理Redis数据"
    echo "  help            显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start-dev     # 开发环境，使用内存缓存"
    echo "  $0 start-redis   # 开发环境，使用Redis"
    echo "  $0 start-prod    # 生产环境，完整部署"
}

start_dev() {
    log_info "启动开发环境（内存缓存模式）..."
    
    # 设置环境变量
    export SPRING_PROFILES_ACTIVE=dev
    
    # 启动后端
    log_info "启动Spring Boot应用..."
    mvn spring-boot:run -Dspring-boot.run.profiles=dev &
    BACKEND_PID=$!
    
    # 等待后端启动
    sleep 10
    
    # 启动前端
    log_info "启动前端服务..."
    cd src/frontend
    npm start &
    FRONTEND_PID=$!
    cd ../..
    
    log_success "开发环境启动完成！"
    log_info "后端地址: http://localhost:8080"
    log_info "前端地址: http://localhost:3000"
    log_info "缓存模式: 内存缓存"
    
    echo $BACKEND_PID > backend_dev.pid
    echo $FRONTEND_PID > frontend_dev.pid
}

start_redis_dev() {
    log_info "启动开发环境（Redis缓存模式）..."
    
    # 检查Docker是否运行
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker未运行，请先启动Docker"
        exit 1
    fi
    
    # 启动Redis容器
    log_info "启动Redis容器..."
    docker run -d \
        --name roomx-redis-dev \
        -p 6379:6379 \
        -e REDIS_PASSWORD=dev_password \
        redis:7-alpine \
        redis-server --requirepass dev_password
    
    # 等待Redis启动
    sleep 5
    
    # 测试Redis连接
    if docker exec roomx-redis-dev redis-cli -a dev_password ping | grep -q "PONG"; then
        log_success "Redis启动成功"
    else
        log_error "Redis启动失败"
        exit 1
    fi
    
    # 设置环境变量
    export SPRING_PROFILES_ACTIVE=dev,redis
    export REDIS_HOST=localhost
    export REDIS_PORT=6379
    export REDIS_PASSWORD=dev_password
    export REDIS_DATABASE=1
    
    # 启动后端
    log_info "启动Spring Boot应用（Redis模式）..."
    mvn spring-boot:run -Dspring-boot.run.profiles=dev,redis &
    BACKEND_PID=$!
    
    # 等待后端启动
    sleep 15
    
    # 启动前端
    log_info "启动前端服务..."
    cd src/frontend
    npm start &
    FRONTEND_PID=$!
    cd ../..
    
    log_success "Redis开发环境启动完成！"
    log_info "后端地址: http://localhost:8080"
    log_info "前端地址: http://localhost:3000"  
    log_info "缓存模式: Redis缓存"
    log_info "Redis管理: http://localhost:8080/api/redis/status"
    
    echo $BACKEND_PID > backend_redis.pid
    echo $FRONTEND_PID > frontend_redis.pid
}

start_prod() {
    log_info "启动生产环境（完整Docker部署）..."
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose未安装"
        exit 1
    fi
    
    # 构建并启动
    log_info "构建Docker镜像..."
    docker-compose build
    
    log_info "启动所有服务..."
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_success "生产环境启动完成！"
        log_info "应用地址: http://localhost:8080"
        log_info "MySQL端口: 3306"
        log_info "Redis端口: 6379"
        docker-compose ps
    else
        log_error "服务启动失败，请检查日志"
        docker-compose logs
        exit 1
    fi
}

stop_services() {
    log_info "停止所有服务..."
    
    # 停止Docker服务
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    fi
    
    # 停止开发Redis
    if docker ps -a | grep -q roomx-redis-dev; then
        docker stop roomx-redis-dev
        docker rm roomx-redis-dev
    fi
    
    # 停止开发环境进程
    if [ -f backend_dev.pid ]; then
        kill $(cat backend_dev.pid) 2>/dev/null || true
        rm backend_dev.pid
    fi
    
    if [ -f frontend_dev.pid ]; then
        kill $(cat frontend_dev.pid) 2>/dev/null || true
        rm frontend_dev.pid
    fi
    
    if [ -f backend_redis.pid ]; then
        kill $(cat backend_redis.pid) 2>/dev/null || true
        rm backend_redis.pid
    fi
    
    if [ -f frontend_redis.pid ]; then
        kill $(cat frontend_redis.pid) 2>/dev/null || true
        rm frontend_redis.pid
    fi
    
    log_success "所有服务已停止"
}

show_status() {
    echo "=== RoomX 服务状态 ==="
    
    # Docker服务状态
    if command -v docker-compose &> /dev/null && docker-compose ps | grep -q "Up"; then
        echo "📦 Docker服务:"
        docker-compose ps
        echo ""
    fi
    
    # 开发Redis状态
    if docker ps | grep -q roomx-redis-dev; then
        echo "🔴 开发Redis: 运行中"
    else
        echo "🔴 开发Redis: 未运行"
    fi
    
    # 进程状态
    echo "💻 本地进程:"
    if [ -f backend_dev.pid ] && kill -0 $(cat backend_dev.pid) 2>/dev/null; then
        echo "  后端(dev): 运行中 (PID: $(cat backend_dev.pid))"
    else
        echo "  后端(dev): 未运行"
    fi
    
    if [ -f backend_redis.pid ] && kill -0 $(cat backend_redis.pid) 2>/dev/null; then
        echo "  后端(redis): 运行中 (PID: $(cat backend_redis.pid))"
    else  
        echo "  后端(redis): 未运行"
    fi
    
    if [ -f frontend_dev.pid ] && kill -0 $(cat frontend_dev.pid) 2>/dev/null; then
        echo "  前端: 运行中 (PID: $(cat frontend_dev.pid))"
    else
        echo "  前端: 未运行"
    fi
    
    # 端口监听状态
    echo ""
    echo "🌐 端口监听:"
    netstat -tlnp 2>/dev/null | grep -E ":3000|:6379|:8080|:3306" || echo "  无相关端口监听"
}

redis_cli() {
    if docker ps | grep -q roomx-redis-dev; then
        log_info "连接到开发Redis..."
        docker exec -it roomx-redis-dev redis-cli -a dev_password
    elif docker-compose ps | grep -q roomx-redis; then
        log_info "连接到生产Redis..."
        docker-compose exec roomx-redis redis-cli -a roomx_redis_password
    else
        log_error "没有运行中的Redis服务"
        exit 1
    fi
}

test_redis() {
    log_info "测试Redis连接..."
    
    # 测试开发Redis
    if docker ps | grep -q roomx-redis-dev; then
        if docker exec roomx-redis-dev redis-cli -a dev_password ping | grep -q "PONG"; then
            log_success "开发Redis连接正常"
        else
            log_error "开发Redis连接失败"
        fi
    fi
    
    # 测试生产Redis  
    if docker-compose ps | grep -q roomx-redis; then
        if docker-compose exec roomx-redis redis-cli -a roomx_redis_password ping | grep -q "PONG"; then
            log_success "生产Redis连接正常"
        else
            log_error "生产Redis连接失败"
        fi
    fi
    
    # 测试应用接口
    if curl -s http://localhost:8080/api/redis/status | grep -q "connected"; then
        log_success "应用Redis接口正常"
    else
        log_warn "应用Redis接口不可用（可能使用内存缓存）"
    fi
}

clean_redis() {
    log_warn "这将清空所有Redis数据，请确认操作 [y/N]: "
    read -r confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        log_info "清理Redis数据..."
        
        # 清理开发Redis
        if docker ps | grep -q roomx-redis-dev; then
            docker exec roomx-redis-dev redis-cli -a dev_password FLUSHDB
            log_info "开发Redis数据已清空"
        fi
        
        # 清理生产Redis
        if docker-compose ps | grep -q roomx-redis; then
            docker-compose exec roomx-redis redis-cli -a roomx_redis_password FLUSHDB
            log_info "生产Redis数据已清空"
        fi
        
        log_success "Redis数据清理完成"
    else
        log_info "操作已取消"
    fi
}

# 主程序
case "$1" in
    start-dev)
        start_dev
        ;;
    start-redis)
        start_redis_dev
        ;;
    start-prod)  
        start_prod
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    redis-cli)
        redis_cli
        ;;
    test-redis)
        test_redis
        ;;
    clean)
        clean_redis
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "无效选项: $1"
        show_help
        exit 1
        ;;
esac
