#!/bin/bash

# RoomX 开发环境启动脚本

echo "🚀 启动 RoomX 开发环境..."

# 检查后端是否已运行
if curl -s http://localhost:8080/api/user/me > /dev/null 2>&1; then
    echo "✅ 后端服务已在运行 (http://localhost:8080)"
else
    echo "🔧 启动后端服务..."
    cd /Users/chenyufan.15/roomX/a-final-work
    mvn spring-boot:run &
    BACKEND_PID=$!
    echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
    
    # 等待后端启动
    echo "⏳ 等待后端服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:8080/api/user/me > /dev/null 2>&1; then
            echo "✅ 后端服务启动完成"
            break
        fi
        sleep 1
    done
fi

# 检查前端是否已运行
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 前端服务已在运行 (http://localhost:3000)"
else
    echo "🔧 启动前端服务..."
    cd /Users/chenyufan.15/roomX/a-final-work/src/frontend
    npm start &
    FRONTEND_PID=$!
    echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
fi

echo ""
echo "🎉 RoomX 开发环境启动完成!"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:8080"
echo "📚 API 文档: http://localhost:8080/swagger-ui.html (如果配置了)"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait 