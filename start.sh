#!/bin/bash

# Balance 项目启动脚本
# 同时启动前后端服务

echo "🚀 正在启动 Balance 项目..."
echo ""

# 启动后端
echo "📦 启动后端服务..."
cd Backend
npm start &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
cd ..

# 等待后端启动
sleep 2

# 启动前端
echo ""
echo "🎨 启动前端服务..."
cd Fronted
npm run dev &
FRONTEND_PID=$!
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "✨ 服务启动完成！"
echo ""
echo "📝 进程信息："
echo "   后端 PID: $BACKEND_PID"
echo "   前端 PID: $FRONTEND_PID"
echo ""
echo "⚠️  停止服务请使用："
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "或者按 Ctrl+C 然后运行 ./stop.sh"

# 保存 PID 到文件，方便后续停止
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# 等待用户中断
wait
