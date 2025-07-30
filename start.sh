#!/bin/bash

# RoomX 全栈应用启动脚本
# 作者: RoomX Team
# 版本: 2.0

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/chenyufan.15/roomX/a-final-work"
FRONTEND_DIR="$PROJECT_ROOT/src/frontend"
BACKEND_PORT=8080
FRONTEND_PORT=3000

# 日志文件
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

# PID文件
BACKEND_PID_FILE="$PROJECT_ROOT/backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/frontend.pid"

# 函数定义
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Java
    if ! command -v java &> /dev/null; then
        log_error "Java 未安装或不在 PATH 中"
        exit 1
    fi
    
    # 检查Maven
    if ! command -v mvn &> /dev/null; then
        log_error "Maven 未安装或不在 PATH 中"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装或不在 PATH 中"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装或不在 PATH 中"
        exit 1
    fi
    
    log_success "所有依赖检查通过"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warn "$service_name 端口 $port 已被占用"
        return 1
    fi
    return 0
}

# 停止服务
stop_service() {
    local service_name=$1
    local pid_file=$2
    local log_file=$3
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "停止 $service_name (PID: $pid)..."
            kill "$pid"
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                log_warn "强制停止 $service_name..."
                kill -9 "$pid"
            fi
            rm -f "$pid_file"
            log_success "$service_name 已停止"
        else
            log_warn "$service_name 进程不存在"
            rm -f "$pid_file"
        fi
    fi
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    if ! check_port $BACKEND_PORT "后端"; then
        log_error "后端端口 $BACKEND_PORT 被占用，请先停止占用该端口的服务"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    
    # 检查是否需要编译
    if [ ! -d "target" ] || [ ! -f "target/classes" ]; then
        log_info "编译后端项目..."
        mvn clean compile -q
    fi
    
    # 启动后端
    log_info "启动 Spring Boot 应用..."
    nohup mvn spring-boot:run > "$BACKEND_LOG" 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "$BACKEND_PID_FILE"
    
    # 等待后端启动
    log_info "等待后端服务启动..."
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$BACKEND_PORT/api/user/me" > /dev/null 2>&1; then
            log_success "后端服务启动成功 (http://localhost:$BACKEND_PORT)"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    log_error "后端服务启动超时"
    return 1
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    
    if ! check_port $FRONTEND_PORT "前端"; then
        log_error "前端端口 $FRONTEND_PORT 被占用，请先停止占用该端口的服务"
        return 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # 检查node_modules
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
    fi
    
    # 启动前端
    log_info "启动 React 开发服务器..."
    nohup npm start > "$FRONTEND_LOG" 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "$FRONTEND_PID_FILE"
    
    # 等待前端启动
    log_info "等待前端服务启动..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
            log_success "前端服务启动成功 (http://localhost:$FRONTEND_PORT)"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    log_error "前端服务启动超时"
    return 1
}

# 显示服务状态
show_status() {
    echo ""
    echo -e "${PURPLE}=== RoomX 服务状态 ===${NC}"
    
    # 后端状态
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$backend_pid" 2>/dev/null; then
            echo -e "${GREEN}✅ 后端服务运行中 (PID: $backend_pid)${NC}"
        else
            echo -e "${RED}❌ 后端服务未运行${NC}"
        fi
    else
        echo -e "${RED}❌ 后端服务未运行${NC}"
    fi
    
    # 前端状态
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 "$frontend_pid" 2>/dev/null; then
            echo -e "${GREEN}✅ 前端服务运行中 (PID: $frontend_pid)${NC}"
        else
            echo -e "${RED}❌ 前端服务未运行${NC}"
        fi
    else
        echo -e "${RED}❌ 前端服务未运行${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}访问地址:${NC}"
    echo -e "  前端应用: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "  后端API:  ${BLUE}http://localhost:$BACKEND_PORT${NC}"
    echo -e "  日志文件: ${BLUE}$LOG_DIR${NC}"
}

# 停止所有服务
stop_all() {
    log_info "停止所有服务..."
    stop_service "后端服务" "$BACKEND_PID_FILE" "$BACKEND_LOG"
    stop_service "前端服务" "$FRONTEND_PID_FILE" "$FRONTEND_LOG"
    log_success "所有服务已停止"
}

# 清理函数
cleanup() {
    log_info "正在清理..."
    stop_all
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    echo -e "${PURPLE}🚀 RoomX 全栈应用启动脚本${NC}"
    echo "=================================="
    
    # 检查依赖
    check_dependencies
    
    # 停止现有服务
    log_info "检查并停止现有服务..."
    stop_all
    
    # 启动后端
    if start_backend; then
        log_success "后端启动完成"
    else
        log_error "后端启动失败"
        exit 1
    fi
    
    # 启动前端
    if start_frontend; then
        log_success "前端启动完成"
    else
        log_error "前端启动失败"
        stop_all
        exit 1
    fi
    
    # 显示状态
    show_status
    
    echo ""
    echo -e "${GREEN}🎉 RoomX 应用启动完成!${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
    
    # 等待用户中断
    wait
}

# 脚本入口
case "${1:-}" in
    "stop")
        stop_all
        ;;
    "status")
        show_status
        ;;
    "restart")
        stop_all
        sleep 2
        main
        ;;
    "logs")
        echo "后端日志:"
        tail -f "$BACKEND_LOG" &
        echo "前端日志:"
        tail -f "$FRONTEND_LOG" &
        wait
        ;;
    *)
        main
        ;;
esac 