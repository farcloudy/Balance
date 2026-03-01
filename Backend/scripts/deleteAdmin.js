const mongoose = require('mongoose')
require('dotenv').config()

const User = require('../models/User')

async function deleteAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balance')
        console.log('MongoDB 连接成功')

        const result = await User.deleteOne({ username: 'admin' })

        if (result.deletedCount > 0) {
            console.log('管理员账户已删除')
        } else {
            console.log('未找到管理员账户')
        }

        process.exit(0)
    } catch (error) {
        console.error('删除管理员账户失败:', error)
        process.exit(1)
    }
}

deleteAdmin()
