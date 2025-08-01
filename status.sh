#!/bin/bash

# 项目状态检查脚本
echo "Checking RoomX Application Status..."

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

# 检查服务状态
check_service_status() {
    local service_name=$1
    local port=$2
    local url=$3
    
    echo "=== $service_name Status ==="
    
    # 检查PID
    local pid=$(get_correct_pid "$service_name" "$port")
    if [ -n "$pid" ]; then
        log_success "$service_name is running (PID: $pid)"
        
        # 显示进程信息
        echo "Process Info:"
        ps -p $pid -o pid,ppid,cmd,etime,pcpu,pmem 2>/dev/null || echo "  Process info not available"
        
        # 检查端口
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_success "Port $port is listening"
        else
            log_warn "Port $port is not listening"
        fi
        
        # 检查服务响应
        if curl -s "$url" > /dev/null 2>&1; then
            log_success "Service is responding at $url"
        else
            log_warn "Service is not responding at $url"
        fi
        
        # 显示日志文件大小
        local log_file="logs/${service_name}.log"
        if [ -f "$log_file" ]; then
            local log_size=$(du -h "$log_file" | cut -f1)
            echo "Log file: $log_file (Size: $log_size)"
        fi
        
    else
        log_error "$service_name is not running"
        
        # 检查端口是否被其他进程占用
        local port_pid=$(lsof -ti:$port 2>/dev/null | head -1)
        if [ -n "$port_pid" ]; then
            log_warn "Port $port is occupied by another process (PID: $port_pid)"
        fi
    fi
    
    echo ""
}

# 检查系统资源
check_system_resources() {
    echo "=== System Resources ==="
    
    # CPU 使用率
    local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    echo "CPU Usage: ${cpu_usage}%"
    
    # 内存使用率
    local mem_info=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    local total_mem=$(sysctl hw.memsize | awk '{print $2}')
    local free_mem=$((mem_info * 4096))
    local used_mem=$((total_mem - free_mem))
    local mem_usage=$((used_mem * 100 / total_mem))
    echo "Memory Usage: ${mem_usage}%"
    
    # 磁盘使用率
    local disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    echo "Disk Usage: ${disk_usage}%"
    
    echo ""
}

# 检查网络连接
check_network() {
    echo "=== Network Status ==="
    
    # 检查本地端口
    echo "Local Ports:"
    netstat -an | grep LISTEN | grep -E ":(3000|8080)" | while read line; do
        echo "  $line"
    done
    
    echo ""
}

# 主检查逻辑
echo ""

# 检查前端状态
check_service_status "frontend" 3000 "http://localhost:3000"

# 检查后端状态
check_service_status "backend" 8080 "http://localhost:8080"

# 检查系统资源
check_system_resources

# 检查网络状态
check_network

echo "Status check completed!" 