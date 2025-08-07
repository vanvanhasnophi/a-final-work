#!/bin/bash

# RoomX Docker 构建脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 函数定义
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
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

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "Docker is available"
}

# 构建镜像
build_image() {
    local tag=${1:-roomx:latest}
    
    log_info "Building Docker image with tag: $tag"
    
    if docker build -t "$tag" .; then
        log_success "Docker image built successfully: $tag"
    else
        log_error "Failed to build Docker image"
        exit 1
    fi
}

# 运行容器
run_container() {
    local image=${1:-roomx:latest}
    local name=${2:-roomx}
    local port=${3:-8080}
    local db_port=${4:-3306}
    
    log_info "Running container: $name"
    
    # 停止并删除现有容器
    docker stop "$name" 2>/dev/null || true
    docker rm "$name" 2>/dev/null || true
    
    # 运行新容器
    docker run -d \
        --name "$name" \
        -p "$port:8080" \
        -p "$db_port:3306" \
        -e SPRING_PROFILES_ACTIVE=prod \
        -e MYSQL_PASSWORD=roomx_password \
        -v mysql_data:/var/lib/mysql \
        "$image"
    
    log_success "Container started: $name"
    log_info "Application will be available at: http://localhost:$port"
    log_info "Database will be available at: localhost:$db_port"
}

# 显示帮助信息
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  build [TAG]     Build Docker image with optional tag"
    echo "  run [IMAGE]     Run container with optional image name"
    echo "  build-and-run   Build and run in one command"
    echo "  stop            Stop and remove container"
    echo "  logs            Show container logs"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build                    # Build with default tag"
    echo "  $0 build roomx:v1.0        # Build with custom tag"
    echo "  $0 run                      # Run with default settings"
    echo "  $0 build-and-run           # Build and run"
    echo "  $0 stop                     # Stop container"
}

# 停止容器
stop_container() {
    local name=${1:-roomx}
    
    log_info "Stopping container: $name"
    
    if docker stop "$name" 2>/dev/null; then
        log_success "Container stopped: $name"
    else
        log_warn "Container was not running: $name"
    fi
    
    if docker rm "$name" 2>/dev/null; then
        log_success "Container removed: $name"
    else
        log_warn "Container was not found: $name"
    fi
}

# 显示日志
show_logs() {
    local name=${1:-roomx}
    
    log_info "Showing logs for container: $name"
    docker logs -f "$name"
}

# 主函数
main() {
    local command=${1:-help}
    
    case "$command" in
        build)
            check_docker
            build_image "$2"
            ;;
        run)
            check_docker
            run_container "$2" "$3" "$4" "$5"
            ;;
        build-and-run)
            check_docker
            build_image "$2"
            run_container "$2" "$3" "$4" "$5"
            ;;
        stop)
            stop_container "$2"
            ;;
        logs)
            show_logs "$2"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@" 