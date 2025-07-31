#!/bin/bash

# 项目启动脚本
echo "Starting RoomX Application..."

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

# 构建前端（如果Node.js可用）
if [ "$SKIP_FRONTEND_BUILD" != "true" ]; then
    log_info "Building frontend..."
    cd src/frontend
    npm install
    npm run build
    cd ../..
fi

# 构建后端
log_info "Building backend..."
mvn clean package -DskipTests

# 启动应用
log_info "Starting application..."
mvn spring-boot:run

log_success "Application started successfully!" 