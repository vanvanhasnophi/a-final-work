#!/bin/bash

# 项目启动脚本
echo "Starting RoomX Application..."

set -e  # 遇到错误时退出

# 创建必要的目录
mkdir -p logs

# 环境变量设置
export NODE_ENV=development
export PORT=3000
export REACT_APP_API_URL=http://localhost:8080

# 设置 Node.js 和 npm 路径（如果使用 nvm）
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    log_info "NVM loaded successfully"
fi

# 设置 npm 配置
export npm_config_registry=https://registry.npmjs.org/
export npm_config_cache="$HOME/.npm"

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

# 检查端口是否被占用
check_port() {
    local port=$1
    local service_name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_error "$service_name port $port is already in use"
        return 1
    fi
    return 0
}

# 等待服务启动
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for $service_name to start..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            log_success "$service_name is ready!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# 检查进程是否存活
check_process() {
    local pid=$1
    local service_name=$2
    
    if [ -z "$pid" ] || [ "$pid" -eq 0 ]; then
        log_error "$service_name PID is invalid: $pid"
        return 1
    fi
    
    if ! ps -p $pid > /dev/null 2>&1; then
        log_error "$service_name process (PID: $pid) is not running"
        return 1
    fi
    
    return 0
}

# 获取正确的PID
get_correct_pid() {
    local service_name=$1
    local port=$2
    
    # 首先尝试从PID文件读取
    local pid_file="logs/${service_name}.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if check_process "$pid" "$service_name"; then
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

# 清理旧的PID文件
cleanup_old_pids() {
    rm -f logs/frontend.pid logs/backend.pid
}

# 检查Java环境
if ! command -v java &> /dev/null; then
    log_error "Error: Java is not installed or not in PATH"
    exit 1
fi

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    log_error "Error: Maven is not installed or not in PATH"
    exit 1
fi

# 检查Node.js环境（用于前端构建）
if ! command -v node &> /dev/null; then
    log_warn "Warning: Node.js is not installed. Frontend build will be skipped."
    SKIP_FRONTEND_BUILD=true
fi

# 检查端口占用
log_info "Checking port availability..."
if ! check_port 3000 "Frontend"; then
    exit 1
fi
if ! check_port 8080 "Backend"; then
    exit 1
fi

# 清理旧的PID文件
cleanup_old_pids

# 构建前端（如果Node.js可用）
if [ "$SKIP_FRONTEND_BUILD" != "true" ]; then
    log_info "Building frontend..."
    cd src/frontend
    
    # 设置前端特定的环境变量
    export REACT_APP_ENV=development
    export REACT_APP_VERSION=$(node -p "require('./package.json').version")
    
    log_info "Installing npm dependencies..."
    if ! npm install --no-audit --no-fund; then
        log_error "Failed to install npm dependencies"
        exit 1
    fi
    
    log_info "Building frontend application..."
    if ! npm run build; then
        log_error "Failed to build frontend application"
        exit 1
    fi
    
    cd ../..
fi

# 构建后端
log_info "Building backend..."
if ! mvn clean package -DskipTests; then
    log_error "Failed to build backend"
    exit 1
fi

# 启动应用
log_info "Starting application..."

# 启动前端（后台运行）
log_info "Starting frontend..."
cd src/frontend

# 设置前端启动环境变量
export REACT_APP_ENV=development
export PORT=3000

# 在后台启动前端
nohup npm start > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待一下让进程启动
sleep 2

# 获取正确的前端PID
FRONTEND_PID=$(get_correct_pid "frontend" 3000)
if [ -z "$FRONTEND_PID" ]; then
    log_error "Failed to start frontend"
    exit 1
fi

echo $FRONTEND_PID > ../../logs/frontend.pid
log_success "Frontend started successfully! (PID: $FRONTEND_PID)"
log_info "Frontend logs: logs/frontend.log"

cd ../..

# 启动后端
log_info "Starting backend..."

# 设置后端环境变量
export SPRING_PROFILES_ACTIVE=dev
export SERVER_PORT=8080

# 在后台启动后端（在项目根目录运行）
nohup mvn spring-boot:run > logs/backend.log 2>&1 &
BACKEND_PID=$!

# 等待一下让进程启动
sleep 3

# 获取正确的后端PID
BACKEND_PID=$(get_correct_pid "backend" 8080)
if [ -z "$BACKEND_PID" ]; then
    log_error "Failed to start backend"
    # 清理前端进程
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 1
fi

echo $BACKEND_PID > logs/backend.pid
log_success "Backend started successfully! (PID: $BACKEND_PID)"
log_info "Backend logs: logs/backend.log"

# 等待服务启动
if ! wait_for_service "http://localhost:3000" "Frontend"; then
    log_error "Frontend health check failed"
    exit 1
fi

if ! wait_for_service "http://localhost:8080" "Backend"; then
    log_error "Backend health check failed"
    exit 1
fi

log_success "Application started successfully!"

# 显示应用信息
echo ""
log_info "Application Information:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8080"
echo "  Frontend PID: $FRONTEND_PID"
echo "  Backend PID:  $BACKEND_PID"
echo ""
log_info "To stop the application, run: ./stop.sh"
echo "" 