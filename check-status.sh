#!/bin/bash

echo "🔍 RoomX 服务状态检查"
echo "========================"

# 检查后端服务
echo "📡 检查后端服务 (http://localhost:8080)..."
if curl -s http://localhost:8080/api/user/me > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务未响应"
fi

# 检查前端服务
echo "🌐 检查前端服务 (http://localhost:3000)..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 前端服务运行正常"
else
    echo "❌ 前端服务未响应"
fi

# 检查端口占用
echo ""
echo "📊 端口占用情况:"
echo "8080 端口 (后端):"
lsof -i :8080 2>/dev/null || echo "   未占用"

echo "3000 端口 (前端):"
lsof -i :3000 2>/dev/null || echo "   未占用"

# 检查进程
echo ""
echo "🔄 进程状态:"
echo "后端进程:"
ps aux | grep "spring-boot:run" | grep -v grep || echo "   未找到"

echo "前端进程:"
ps aux | grep "react-scripts" | grep -v grep || echo "   未找到"

echo ""
echo "🎯 访问地址:"
echo "前端应用: http://localhost:3000"
echo "后端API: http://localhost:8080"
echo "测试页面: http://localhost:3000/test" 