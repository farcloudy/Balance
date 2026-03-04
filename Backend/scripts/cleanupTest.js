const mongoose = require('mongoose')
require('dotenv').config()

const User = require('../models/User')
const Book = require('../models/Book')
const Account = require('../models/Account')

async function cleanupTestData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('已连接到数据库')

        // 删除测试用户
        const result1 = await User.deleteMany({ username: { $in: ['testuser1', 'testuser2'] } })
        console.log(`删除了 ${result1.deletedCount} 个测试用户`)

        // 删除测试账套和科目
        const users = await User.find({ username: { $in: ['testuser1', 'testuser2'] } })
        for (const user of users) {
            const books = await Book.find({ userId: user._id })
            for (const book of books) {
                await Account.deleteMany({ bookId: book._id })
            }
            await Book.deleteMany({ userId: user._id })
        }

        console.log('清理完成')
        await mongoose.connection.close()
    } catch (error) {
        console.error('清理失败:', error)
        process.exit(1)
    }
}

cleanupTestData()
