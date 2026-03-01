const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
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
        const hashedPassword = await bcrypt.hash('admin123', 10)
        const admin = await User.create({
            username: 'admin',
            password: hashedPassword,
            type: '管理员'
        })

        console.log('管理员账户创建成功:')
        console.log('  用户名: admin')
        console.log('  密码: admin123')
        console.log('  请在首次登录后修改密码')

        process.exit(0)
    } catch (error) {
        console.error('初始化管理员账户失败:', error)
        process.exit(1)
    }
}

initAdmin()
