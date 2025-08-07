#!/bin/bash

# 项目停止脚本
echo "Stopping RoomX Application..."

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

# 获取正确的PID
get_correct_pid() {
    local service_name=$1
    local port=$2
    
    # 首先尝试从PID文件读取
    local pid_file="logs/${service_name}.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ -n "$pid" ] && ps -p $pid > /dev/null 2>&1; then
            echo $pid
            return 0
        fi
    fi
    
    # 如果PID文件无效，通过端口查找进程
    local port_pid=$(lsof -ti:$port 2>/dev/null | head -1)
    if [ -n "$port_pid" ]; then
        echo $port_pid
        return 0
    fi
    
    echo ""
    return 1
}

# 优雅停止进程
stop_process() {
    local pid=$1
    local service_name=$2
    local port=$3
    
    if [ -z "$pid" ]; then
        log_warn "$service_name process not found"
        return 0
    fi
    
    log_info "Stopping $service_name (PID: $pid)..."
    
    # 尝试优雅停止
    kill $pid 2>/dev/null || true
    sleep 2
    
    # 检查进程是否还在运行
    if ps -p $pid > /dev/null 2>&1; then
        log_warn "$service_name process still running, force killing..."
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
    
    # 最终检查
    if ps -p $pid > /dev/null 2>&1; then
        log_error "Failed to stop $service_name process"
        return 1
    else
        log_success "$service_name stopped successfully"
        return 0
    fi
}

# 停止前端
FRONTEND_PID=$(get_correct_pid "frontend" 3000)
if [ -n "$FRONTEND_PID" ]; then
    stop_process "$FRONTEND_PID" "Frontend" 3000
    rm -f logs/frontend.pid
else
    log_warn "Frontend process not found"
fi

# 停止后端
BACKEND_PID=$(get_correct_pid "backend" 8080)
if [ -n "$BACKEND_PID" ]; then
    stop_process "$BACKEND_PID" "Backend" 8080
    rm -f logs/backend.pid
else
    log_warn "Backend process not found"
fi

# 清理端口占用（可选）
log_info "Checking for remaining processes on ports 3000 and 8080..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

log_success "Application stopped successfully!" 