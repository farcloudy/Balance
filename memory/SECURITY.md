# 安全机制文档

本文档记录 Balance 系统的安全相关实现和最佳实践。

## 密码加密机制

### 二次哈希策略

Balance 系统采用**二次哈希**策略来保护用户密码：

**加密流程**：
1. **前端加密**：用户输入明文密码 → 使用 crypto-js 进行 SHA-256 加密 → 传输到后端
2. **后端加密**：接收前端加密后的字符串 → 使用 bcrypt 进行二次哈希（salt rounds: 10）→ 存储到数据库

**安全优势**：
- 即使 HTTPS 传输过程被截获，攻击者也无法直接获取明文密码
- 数据库泄露时，攻击者需要同时破解两层加密才能还原明文
- bcrypt 的 salt 机制防止彩虹表攻击

### 实现位置

**前端**（待实现）：
- 位置：`Fronted/src/utils/crypto.js`（或类似位置）
- 使用库：crypto-js
- 加密算法：SHA-256

**后端**：
- 位置：`Backend/routes/auth.js`
- 注册接口：第 63-67 行
- 登录接口：第 120-122 行
- 使用库：bcryptjs
- Salt rounds：10

### 管理员账户初始化

**脚本位置**：`Backend/scripts/initAdmin.js`

**实现逻辑**：
```javascript
// 1. 明文密码
const plainPassword = 'admin123'

// 2. 第一次加密（模拟前端 SHA-256）
const firstHash = crypto.createHash('sha256').update(plainPassword).digest('hex')

// 3. 第二次加密（后端 bcrypt）
const hashedPassword = await bcrypt.hash(firstHash, 10)
```

**注意事项**：
- 初始化脚本必须模拟前端的 SHA-256 加密流程
- 确保与用户注册/登录流程保持一致
- 管理员首次登录后应立即修改密码

## JWT 认证

### Token 配置

**环境变量**：
- `JWT_SECRET`：JWT 签名密钥（必需）
- `JWT_EXPIRES_IN`：Token 过期时间（默认：7天）

**实现位置**：
- Token 生成：`Backend/routes/auth.js:14-20`
- Token 验证：`Backend/middleware/auth.js:8-58`

### Token 格式

**请求头**：
```
Authorization: Bearer <token>
```

**Token Payload**：
```json
{
  "userId": "用户 MongoDB ObjectId",
  "iat": "签发时间",
  "exp": "过期时间"
}
```

### 错误处理

- `401 未提供认证令牌`：请求头中没有 token
- `401 无效的认证令牌`：token 格式错误或签名验证失败
- `401 认证令牌已过期`：token 已超过有效期
- `401 用户不存在`：token 有效但用户已被删除

## 代码审查记录

### 2026-03-01 第一阶段审查

**审查文件**：`temp/代码审查报告.md`

**主要修改**：
1. 澄清了 `Backend/routes/auth.js` 中的密码加密注释（第 63-67 行）
2. 修正了 `Backend/scripts/initAdmin.js` 的密码加密逻辑，使其符合二次哈希策略
3. 应用了 temp 目录中的代码改进到主分支

**修改原则**：
- 最小改动原则
- 注释优先修改
- 保持代码逻辑一致性

## 安全最佳实践

### 环境变量管理

- ✅ 使用 `.env` 文件存储敏感配置
- ✅ `.env` 文件已加入 `.gitignore`
- ⚠️ 生产环境必须使用强随机 `JWT_SECRET`

### 密码策略（前端实现）

建议的密码要求：
- 最小长度：6 个字符
- 建议包含：大小写字母、数字、特殊字符
- 前端负责验证和提示

### API 安全

- ✅ 所有敏感接口使用 JWT 认证中间件
- ✅ 统一的错误响应格式
- ✅ 避免在错误信息中泄露敏感信息（如"用户名或密码错误"而非"用户名不存在"）

## 待实现功能

- [ ] 前端密码加密实现（crypto-js + SHA-256）
- [ ] 密码强度验证
- [ ] 密码修改功能
- [ ] Token 刷新机制
- [ ] 登录日志记录
- [ ] 账户锁定机制（防暴力破解）
- [ ] 双因素认证（可选）
