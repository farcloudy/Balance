#!/bin/bash

# Balance 项目停止脚本
# 停止前后端服务

echo "🛑 正在停止 Balance 项目..."
echo ""

# 读取 PID 文件
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo "✅ 后端服务已停止 (PID: $BACKEND_PID)"
    else
        echo "⚠️  后端服务未运行"
    fi
    rm .backend.pid
else
    echo "⚠️  未找到后端 PID 文件"
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止 (PID: $FRONTEND_PID)"
    else
        echo "⚠️  前端服务未运行"
    fi
    rm .frontend.pid
else
    echo "⚠️  未找到前端 PID 文件"
fi

echo ""
echo "✨ 服务已停止"
