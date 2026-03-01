# Balance 记账系统 - 后端开发计划

## 项目状态

### 已完成
- ✅ 数据库设计文档（database_design.md）
- ✅ 前端项目初始化（Vue 3 + Pinia + Vue Router）
- ✅ 后端基础框架（Express + MongoDB）
- ✅ 管理员账户初始化脚本
- ✅ User 模型定义

### 待开发
本计划按照优先级和依赖关系，分阶段实现后端功能。

---

## 第一阶段：用户认证系统（核心基础）

### 目标
实现完整的用户认证功能，让用户能够注册、登录和访问系统。

### 任务清单

#### 1.1 认证中间件
- [ ] 创建 `middleware/auth.js`
  - JWT token 验证
  - 从 token 提取 userId
  - 错误处理（token 过期、无效等）

#### 1.2 认证路由
- [ ] 创建 `routes/auth.js`
  - POST `/api/auth/register` - 用户注册
  - POST `/api/auth/login` - 用户登录
  - GET `/api/auth/me` - 获取当前用户信息
  - POST `/api/auth/logout` - 用户登出（可选）

#### 1.3 集成到主应用
- [ ] 更新 `index.js`
  - 引入认证路由
  - 配置 JWT 密钥（环境变量）
  - 添加错误处理中间件

#### 1.4 测试
- [ ] 测试用户注册流程
- [ ] 测试用户登录并获取 token
- [ ] 测试受保护路由的访问控制

---

## 第二阶段：账套管理（多租户基础）

### 目标
实现账套的创建、查询、更新和删除，确保多租户数据隔离。

### 任务清单

#### 2.1 Book 模型
- [ ] 创建 `models/Book.js`
  - 定义 schema（参考 database_design.md）
  - 添加验证规则

#### 2.2 账套权限中间件
- [ ] 创建 `middleware/bookAccess.js`
  - 验证 bookId 属于当前用户
  - 自动注入 book 对象到 req

#### 2.3 账套路由
- [ ] 创建 `routes/books.js`
  - POST `/api/books` - 创建账套
  - GET `/api/books` - 获取用户的所有账套
  - GET `/api/books/:id` - 获取单个账套详情
  - PUT `/api/books/:id` - 更新账套信息
  - DELETE `/api/books/:id` - 删除/归档账套

#### 2.4 标准科目模板
- [ ] 创建 `utils/accountTemplate.js`
  - 定义标准会计科目结构（参考 database_design.md）
  - 创建账套时自动初始化科目

#### 2.5 测试
- [ ] 测试创建账套并自动初始化科目
- [ ] 测试多租户隔离（用户 A 无法访问用户 B 的账套）

---

## 第三阶段：会计科目管理

### 目标
实现会计科目的增删改查，支持层级结构。

### 任务清单

#### 3.1 Account 模型
- [ ] 创建 `models/Account.js`
  - 定义 schema（参考 database_design.md）
  - 添加验证规则（科目代码唯一性等）

#### 3.2 会计科目路由
- [ ] 创建 `routes/accounts.js`
  - GET `/api/books/:bookId/accounts` - 获取账套的所有科目
  - GET `/api/books/:bookId/accounts/:id` - 获取单个科目详情
  - POST `/api/books/:bookId/accounts` - 创建自定义科目
  - PUT `/api/books/:bookId/accounts/:id` - 更新科目信息
  - DELETE `/api/books/:bookId/accounts/:id` - 停用科目

#### 3.3 科目余额查询
- [ ] 创建 `utils/accountBalance.js`
  - 实现 `getAccountBalance()` 函数（参考 database_design.md）
  - 支持指定日期查询余额

#### 3.4 测试
- [ ] 测试科目的层级结构
- [ ] 测试科目余额计算的准确性

---

## 第四阶段：分录和凭证管理（核心业务）

### 目标
实现复式记账的核心功能，支持创建、查询、修改和冲销凭证。

### 任务清单

#### 4.1 Entry 模型
- [ ] 创建 `models/Entry.js`
  - 定义 schema（参考 database_design.md）
  - 添加验证规则（借贷平衡等）

#### 4.2 凭证号生成
- [ ] 创建 `utils/voucherNo.js`
  - 实现凭证号生成逻辑（JNL-YYYY-NNN）
  - 确保凭证号唯一性

#### 4.3 分录路由
- [ ] 创建 `routes/entries.js`
  - POST `/api/books/:bookId/entries` - 创建分录（支持多行）
  - GET `/api/books/:bookId/entries` - 查询分录列表
  - GET `/api/books/:bookId/entries/:voucherNo` - 获取凭证详情
  - PUT `/api/books/:bookId/entries/:voucherNo` - 修改草稿凭证
  - POST `/api/books/:bookId/entries/:voucherNo/post` - 过账
  - POST `/api/books/:bookId/entries/:voucherNo/reverse` - 冲销凭证

#### 4.4 凭证验证
- [ ] 创建 `utils/validation.js`
  - 验证借贷平衡
  - 验证科目有效性
  - 验证日期合理性

#### 4.5 测试
- [ ] 测试创建简单凭证（一借一贷）
- [ ] 测试创建复杂凭证（多借多贷）
- [ ] 测试借贷不平衡时的错误处理
- [ ] 测试凭证过账和冲销

---

## 第五阶段：AI 辅助录入（特色功能）

### 目标
集成视觉模型，实现图片识别和智能会计科目建议。

### 任务清单

#### 5.1 对象存储集成
- [ ] 参考 `D:\Work\Sheet\backend\routers` 实现
- [ ] 配置对象存储（阿里云 OSS 或其他）
- [ ] 实现图片上传功能

#### 5.2 AI API 封装
- [ ] 创建 `utils/aiClient.js`
  - 支持多个 AI 提供商（Claude Vision、GPT-4 Vision 等）
  - 统一的调用接口
  - 错误处理和重试机制

#### 5.3 AI 路由
- [ ] 创建 `routes/ai.js`
  - POST `/api/books/:bookId/ai/extract` - 上传图片并提取信息
  - POST `/api/books/:bookId/ai/suggest` - 获取会计科目建议

#### 5.4 AI 辅助录入流程
- [ ] 实现完整的 AI 辅助录入流程（参考 database_design.md）
  - 上传图片 → AI 提取 → 创建草稿 → 用户审核 → 过账

#### 5.5 测试
- [ ] 测试支付截图识别
- [ ] 测试银行回单识别
- [ ] 测试 AI 建议的准确性

---

## 第六阶段：财务报表生成

### 目标
实现资产负债表、利润表和现金流量表的生成和缓存。

### 任务清单

#### 6.1 Report 模型
- [ ] 创建 `models/Report.js`
  - 定义 schema（参考 database_design.md）
  - 添加索引

#### 6.2 报表生成逻辑
- [ ] 创建 `utils/reportGenerator.js`
  - 实现 `generateBalanceSheet()` - 资产负债表
  - 实现 `generateIncomeStatement()` - 利润表
  - 实现 `generateCashFlowStatement()` - 现金流量表

#### 6.3 报表路由
- [ ] 创建 `routes/reports.js`
  - GET `/api/books/:bookId/reports/balance-sheet` - 资产负债表
  - GET `/api/books/:bookId/reports/income-statement` - 利润表
  - GET `/api/books/:bookId/reports/cash-flow` - 现金流量表
  - POST `/api/books/:bookId/reports/regenerate` - 重新生成报表

#### 6.4 测试
- [ ] 测试报表生成的准确性
- [ ] 测试不同期间的报表（月度、季度、年度）
- [ ] 测试报表缓存机制

---

## 第七阶段：优化和完善

### 目标
提升系统性能、安全性和用户体验。

### 任务清单

#### 7.1 性能优化
- [ ] 添加数据库索引（参考 database_design.md）
- [ ] 实现分页查询
- [ ] 优化报表生成性能

#### 7.2 安全加固
- [ ] 添加请求频率限制（rate limiting）
- [ ] 添加输入验证和清理
- [ ] 实现密码强度要求
- [ ] 添加操作日志

#### 7.3 错误处理
- [ ] 统一错误响应格式
- [ ] 添加详细的错误日志
- [ ] 实现友好的错误提示

#### 7.4 文档
- [ ] 编写 API 文档
- [ ] 添加代码注释
- [ ] 编写部署文档

---

## 技术规范

### 代码风格
- 使用 4 个空格缩进
- 单引号、不使用分号
- 遵循 ESLint 配置

### 数值处理
- 所有金额以整数（分）存储
- 前端显示时除以 100 并保留 2 位小数

### 错误处理
- 使用 try-catch 包裹异步操作
- 返回统一的错误格式：`{ success: false, error: '错误信息' }`

### 多租户隔离
- 所有查询必须包含 userId 和 bookId 过滤
- 使用中间件自动验证权限

---

## 开发顺序建议

1. **第一阶段** → **第二阶段** → **第三阶段** → **第四阶段**（核心功能）
2. **第五阶段**（特色功能，可并行开发）
3. **第六阶段**（报表功能）
4. **第七阶段**（优化完善）

---

## 预计时间线

- 第一阶段：1-2 天
- 第二阶段：2-3 天
- 第三阶段：1-2 天
- 第四阶段：3-4 天
- 第五阶段：3-5 天
- 第六阶段：2-3 天
- 第七阶段：2-3 天

**总计：约 2-3 周**

---

## 注意事项

1. 每个阶段完成后进行充分测试
2. 及时提交代码到 git
3. 遇到问题及时记录和解决
4. 保持代码简洁，避免过度设计
5. 优先实现核心功能，再添加辅助功能
