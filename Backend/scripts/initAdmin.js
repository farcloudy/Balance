const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
require('dotenv').config()

const User = require('../models/User')

async function initAdmin() {
    try {
        // 连接数据库
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balance')
        console.log('MongoDB 连接成功')

        // 检查管理员是否已存在
        const existingAdmin = await User.findOne({ username: 'admin' })
        if (existingAdmin) {
            console.log('管理员账户已存在')
            process.exit(0)
        }

        // 创建管理员账户
        // 密码加密流程（与前端一致）：
        // 1. 明文密码 'admin123'
        // 2. 使用 SHA-256 进行第一次加密（模拟前端加密）
        const plainPassword = 'admin123'
        const firstHash = crypto.createHash('sha256').update(plainPassword).digest('hex')

        // 3. 使用 bcrypt 进行第二次哈希（后端加密）
        const hashedPassword = await bcrypt.hash(firstHash, 10)

        const admin = await User.create({
            username: 'admin',
            password: hashedPassword,
            type: '管理员'
        })

        console.log('管理员账户创建成功:')
        console.log('  用户名: admin')
        console.log('  密码: admin123')
        console.log('  请在首次登录后修改密码')
        console.log('')
        console.log('注意：登录时前端会自动对密码进行 SHA-256 加密后传输')

        process.exit(0)
    } catch (error) {
        console.error('初始化管理员账户失败:', error)
        process.exit(1)
    }
}

initAdmin()
