# 登录错误诊断报告

**日期**: 2026-03-01
**问题**: 前端登录时出现 `Network Error`

---

## 问题现象

用户在前端（localhost:5173）尝试登录时，收到错误提示：`登录失败：Network Error`

---

## 根本原因

**后端服务未能正常启动**，导致前端无法连接到 API 端点。

### PM2 状态分析

```
┌────┬──────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name     │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │
├────┼──────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0  │ index    │ default     │ 1.0.0   │ fork    │ 0        │ 0      │ 17   │ errored   │
└────┴──────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

关键信息：
- **status**: `errored` - 进程处于错误状态
- **pid**: `0` - 没有运行中的进程
- **重启次数**: `17` - 进程反复崩溃重启
- PM2 判定为 "too many unstable restarts"，已停止自动重启

### 错误日志

```
Error: Cannot find module '../middleware/auth'
Require stack:
- D:\Work\代码\Balance\Backend\routes\auth.js
- D:\Work\代码\Balance\Backend\index.js
```

**核心问题**：`Backend/routes/auth.js` 第 5 行尝试引入 `../middleware/auth` 模块，但该文件不存在。

### 目录结构检查

```bash
Backend/
├── middleware/          # 目录存在但为空
├── models/
│   └── User.js         # 存在
├── routes/
│   └── auth.js         # 存在，但引用了不存在的 middleware/auth
└── index.js
```

**确认**：`Backend/middleware/` 目录存在但完全为空，缺少 `auth.js` 文件。

---

## 影响范围

1. **后端服务完全无法启动**
2. **所有 API 端点不可用**（包括登录、注册、获取用户信息等）
3. **前端所有需要后端交互的功能均失效**

---

## 解决方案

### 立即修复

创建缺失的 JWT 认证中间件文件 `Backend/middleware/auth.js`：

```javascript
const jwt = require('jsonwebtoken')
const User = require('../models/User')

/**
 * JWT 认证中间件
 * 验证请求头中的 token，并将用户信息附加到 req.user
 */
const auth = async (req, res, next) => {
    try {
        // 从请求头获取 token
        const token = req.header('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return res.status(401).json({
                success: false,
                error: '未提供认证令牌'
            })
        }

        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // 查找用户
        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                success: false,
                error: '用户不存在'
            })
        }

        // 将用户信息附加到请求对象
        req.user = user
        req.token = token

        next()
    } catch (error) {
        console.error('认证错误:', error)
        res.status(401).json({
            success: false,
            error: '认证失败，请重新登录'
        })
    }
}

module.exports = auth
```

### 重启服务

创建文件后，重启 PM2 服务：

```bash
pm2 restart index
# 或
pm2 delete index && pm2 start Backend/index.js
```

### 验证修复

1. 检查 PM2 状态：`pm2 list` - 确认 status 为 `online`
2. 查看日志：`pm2 logs index --lines 20` - 确认无错误
3. 测试健康检查：`curl http://localhost:3000/health`
4. 前端重新尝试登录

---

## 预防措施

1. **代码审查**：在提交代码前确保所有引用的模块都已创建
2. **启动检查**：开发时使用 `node index.js` 直接运行，能更快发现模块缺失问题
3. **依赖管理**：建立项目文件清单，确保关键文件完整性
4. **错误监控**：配置 PM2 错误通知，及时发现服务崩溃

---

## 相关文件

- `Backend/routes/auth.js:5` - 引用缺失模块的位置
- `Backend/middleware/` - 需要创建 `auth.js` 的目录
- `Backend/index.js:23` - 导入 auth 路由的位置

---

## 后续问题修复（2026-03-01）

### 问题 2：登录 401 错误

**现象**：后端服务正常启动后，前端登录时收到 `Request failed with status code 401`

**原因**：前端未实现密码 SHA-256 加密，直接发送明文密码到后端。根据二次哈希策略，后端期望接收的是 SHA-256 加密后的字符串。

**解决方案**：

1. ✅ 安装 `crypto-js` 依赖
2. ✅ 创建加密工具函数 `Fronted/src/utils/crypto.js`
3. ✅ 修改登录页面 `Fronted/src/views/Login.vue`，在发送请求前对密码进行 SHA-256 加密

**测试**：使用管理员账户登录（用户名：`admin`，密码：`admin123`）
