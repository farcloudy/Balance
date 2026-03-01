# 前端配置信息

本文档记录 Balance 项目前端的配置信息和技术细节。

## 初始化时间

2026-03-01

## 技术栈版本

### 核心依赖
- **Vue**: 3.5.25
- **Vite**: 7.3.1
- **Pinia**: 3.0.4
- **Vue Router**: 5.0.3
- **Axios**: 1.7.9

### 开发依赖
- **@vitejs/plugin-vue**: 6.0.2

## 项目结构

```
Fronted/
├── src/
│   ├── api/              # API 接口封装
│   │   └── auth.js       # 认证相关接口
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── router/           # 路由配置
│   │   └── index.js      # 路由主文件
│   ├── stores/           # Pinia 状态管理
│   │   ├── index.js      # Pinia 实例
│   │   └── user.js       # 用户状态 store
│   ├── utils/            # 工具函数
│   │   └── request.js    # Axios 请求封装
│   ├── views/            # 页面组件
│   │   ├── Home.vue      # 首页
│   │   └── Login.vue     # 登录页
│   ├── App.vue           # 根组件
│   ├── main.js           # 入口文件
│   └── style.css         # 全局样式
├── public/               # 公共静态资源
├── .env                  # 环境变量
├── .env.development      # 开发环境变量
├── .env.production       # 生产环境变量
├── .prettierrc           # Prettier 配置
├── .eslintrc.json        # ESLint 配置
├── vite.config.js        # Vite 配置
└── package.json          # 项目配置
```

## 核心配置

### 1. 路由配置 (src/router/index.js)

- 使用 `createWebHistory` 模式
- 路由懒加载
- 当前路由：
  - `/` - 首页 (Home.vue)
  - `/login` - 登录页 (Login.vue)

### 2. 状态管理 (src/stores/)

**用户 Store (user.js)**:
- `token`: 用户令牌（持久化到 localStorage）
- `userInfo`: 用户信息
- `setToken()`: 设置令牌
- `setUserInfo()`: 设置用户信息
- `logout()`: 退出登录

### 3. Axios 请求封装 (src/utils/request.js)

**请求拦截器**:
- 自动添加 `Authorization` header（Bearer token）

**响应拦截器**:
- 401 状态码自动退出登录并跳转到登录页
- 统一返回 `response.data`

**配置**:
- baseURL: 从环境变量读取 `VITE_API_BASE_URL`
- timeout: 10000ms

### 4. Vite 配置 (vite.config.js)

**路径别名**:
- `@` 指向 `src/` 目录

**开发服务器**:
- 端口: 5173
- 代理配置: `/api` 代理到 `http://localhost:3000`

### 5. 环境变量

**开发环境** (.env.development):
```
VITE_API_BASE_URL=http://localhost:3000/api
```

**生产环境** (.env.production):
```
VITE_API_BASE_URL=/api
```

### 6. 代码规范

**Prettier 配置** (.prettierrc):
- 不使用分号 (`semi: false`)
- 单引号 (`singleQuote: true`)
- 4 空格缩进 (`tabWidth: 4`)
- 不使用尾随逗号 (`trailingComma: "none"`)
- 每行最大 100 字符 (`printWidth: 100`)

**ESLint 配置** (.eslintrc.json):
- 4 空格缩进
- 单引号
- 不使用分号
- Vue 3 推荐规则

## API 接口规范

### 认证接口 (src/api/auth.js)

**登录**:
```javascript
POST /auth/login
Body: { username, password }
Response: { token, user }
```

**注册**:
```javascript
POST /auth/register
Body: { username, password }
```

**获取用户信息**:
```javascript
GET /auth/info
Headers: { Authorization: Bearer <token> }
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:5173)
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 注意事项

1. **目录名拼写**: 前端目录名为 `Fronted`（不是 Frontend）
2. **货币精度**: 前端显示金额时需要除以 100 并保留 2 位小数
3. **Token 管理**: Token 存储在 localStorage，页面刷新后自动恢复
4. **401 处理**: 请求返回 401 时自动清除 token 并跳转登录页
