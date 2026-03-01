# MongoDB 配置信息

本文档记录本机 MongoDB 的安装和配置信息。

## 安装信息

- **版本**: MongoDB 8.2
- **安装日期**: 2026-03-01
- **安装方式**: 手动安装 MSI 包
- **服务运行方式**: Run as Network Service user

## 目录结构

- **程序安装目录**: `C:\Program Files\MongoDB\Server\8.2\`
- **可执行文件目录**: `C:\Program Files\MongoDB\Server\8.2\bin\`
- **数据存储目录**: `D:\Program Files\MongoDB\Server\8.2\data\`
- **日志目录**: `D:\Program Files\MongoDB\Server\8.2\log\`
- **配置文件**: `C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg`

## 网络配置

- **监听端口**: 27017
- **绑定地址**: 127.0.0.1 (仅本地访问)
- **连接字符串**: `mongodb://127.0.0.1:27017` 或 `mongodb://localhost:27017`

## 服务信息

- **服务名称**: MongoDB
- **服务状态**: RUNNING
- **服务类型**: WIN32_OWN_PROCESS
- **启动方式**: 自动启动

## 配置详情

```yaml
# 数据存储
storage:
  dbPath: D:\Program Files\MongoDB\Server\8.2\data

# 日志
systemLog:
  destination: file
  logAppend: true
  path: D:\Program Files\MongoDB\Server\8.2\log\mongod.log

# 网络
net:
  port: 27017
  bindIp: 127.0.0.1
```

## Node.js 连接示例

```javascript
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function connect() {
    try {
        await client.connect();
        console.log('MongoDB 连接成功');
    } catch (error) {
        console.error('MongoDB 连接失败:', error);
    }
}
```

## 常用命令

```bash
# 检查服务状态
sc query MongoDB

# 启动服务
net start MongoDB

# 停止服务
net stop MongoDB

# 重启服务
net stop MongoDB && net start MongoDB
```

## 注意事项

1. MongoDB 仅监听本地连接（127.0.0.1），不接受外部连接
2. 数据目录在 D 盘，确保有足够的磁盘空间
3. 未安装 MongoDB Shell (mongosh)，如需使用请单独安装
4. 服务以 Network Service 用户身份运行
