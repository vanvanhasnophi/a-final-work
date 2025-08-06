#!/bin/bash

# RoomX 前端启动脚本
echo "Starting RoomX Frontend..."

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

# 检查前端目录
check_frontend_dir() {
    log_info "Checking frontend directory..."
    
    if [ ! -d "src/frontend" ]; then
        log_error "Frontend directory not found: src/frontend"
        exit 1
    fi
    
    if [ ! -f "src/frontend/package.json" ]; then
        log_error "package.json not found in frontend directory"
        exit 1
    fi
    
    log_success "Frontend directory structure is correct"
}

# 安装依赖
install_dependencies() {
    log_info "Installing frontend dependencies..."
    
    cd src/frontend
    
    # 检查node_modules是否存在
    if [ ! -d "node_modules" ]; then
        log_info "Installing npm dependencies..."
        npm install
    else
        log_info "Checking for dependency updates..."
        npm install
    fi
    
    log_success "Frontend dependencies installed"
    cd ../..
}

# 启动前端
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

# 健康检查
health_check() {
    log_info "Performing frontend health check..."
    
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
}

# 信号处理
cleanup() {
    log_info "Shutting down frontend..."
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        wait $FRONTEND_PID 2>/dev/null || true
    fi
    
    log_success "Frontend stopped"
    exit 0
}

# 设置信号处理
trap cleanup SIGTERM SIGINT

# 主函数
main() {
    log_info "Starting RoomX Frontend..."
    
    # 检查环境
    check_node
    check_frontend_dir
    
    # 安装依赖
    install_dependencies
    
    # 启动前端
    start_frontend
    
    # 健康检查
    health_check
    
    log_success "RoomX Frontend started successfully!"
    log_info "Frontend Information:"
    echo "  URL: http://localhost:3000"
    echo "  Backend API: http://localhost:8080"
    echo ""
    echo "Press Ctrl+C to stop the frontend"
    
    # 保持脚本运行
    wait $FRONTEND_PID
}

# 运行主函数
main "$@" 