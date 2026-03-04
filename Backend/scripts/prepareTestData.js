const mongoose = require('mongoose')
const User = require('../models/User')
const Book = require('../models/Book')
const Account = require('../models/Account')
const accountService = require('../services/accountService')
require('dotenv').config()

/**
 * 准备第四阶段测试数据
 */

async function prepareTestData() {
    try {
        console.log('=== 准备第四阶段测试数据 ===\n')

        // 连接数据库
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✓ 数据库连接成功\n')

        // 1. 查找或使用现有的 admin 用户
        console.log('1. 查找测试用户...')
        const testUser = await User.findOne({ username: 'admin' })
        if (!testUser) {
            throw new Error('admin 用户不存在，请先运行 initAdmin.js')
        }
        console.log(`✓ 找到测试用户: ${testUser.username}\n`)

        // 2. 查找或创建测试账套
        console.log('2. 准备测试账套...')
        let testBook = await Book.findOne({ userId: testUser._id, status: 'active' })

        if (!testBook) {
            console.log('  - 未找到活跃账套，创建新账套...')
            testBook = await Book.create({
                userId: testUser._id,
                name: '测试账套',
                description: '用于第四阶段测试',
                currency: 'CNY',
                fiscalYearStart: 1,
                status: 'active'
            })
            console.log(`✓ 创建测试账套: ${testBook.name}`)

            // 初始化会计科目
            const accountsCount = await accountService.createAccountsFromTemplate(testBook._id)
            console.log(`✓ 初始化了 ${accountsCount} 个会计科目`)
        } else {
            console.log(`✓ 找到现有账套: ${testBook.name}`)

            // 检查是否有科目
            const accountCount = await Account.countDocuments({ bookId: testBook._id })
            console.log(`✓ 账套中有 ${accountCount} 个会计科目`)

            if (accountCount === 0) {
                console.log('  - 科目为空，初始化会计科目...')
                const accountsCount = await accountService.createAccountsFromTemplate(testBook._id)
                console.log(`✓ 初始化了 ${accountsCount} 个会计科目`)
            }
        }

        console.log('\n=== 测试数据准备完成 ✓ ===')
        console.log(`\n测试账套 ID: ${testBook._id}`)
        console.log(`测试用户 ID: ${testUser._id}`)

    } catch (error) {
        console.error('\n✗ 准备失败:', error.message)
        console.error(error)
    } finally {
        await mongoose.connection.close()
        console.log('\n数据库连接已关闭')
    }
}

// 运行准备脚本
prepareTestData()
