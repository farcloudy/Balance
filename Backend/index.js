const express = require('express')
const cors = require('cors')
const connectDB = require('./config/database')
require('dotenv').config()

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 连接数据库
connectDB()

// 检查必需的环境变量
if (!process.env.JWT_SECRET) {
    console.error('错误：未配置 JWT_SECRET 环境变量')
    process.exit(1)
}

// 导入路由
const authRoutes = require('./routes/auth')
const bookRoutes = require('./routes/books')
const accountRoutes = require('./routes/accounts')
const entryRoutes = require('./routes/entries')

// 基础路由
app.get('/', (req, res) => {
    res.json({ message: 'Balance 记账系统 API' })
})

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/books', accountRoutes)
app.use('/api/books', entryRoutes)

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '请求的资源不存在'
    })
})

// 全局错误处理中间件
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // next 参数必须保留，这是 Express 识别错误处理中间件的方式
    console.error('服务器错误:', err)

    res.status(err.status || 500).json({
        success: false,
        error: err.message || '服务器内部错误'
    })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`)
})
