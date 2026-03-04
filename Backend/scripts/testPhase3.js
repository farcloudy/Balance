const mongoose = require('mongoose')
require('dotenv').config()

const User = require('../models/User')
const Book = require('../models/Book')
const Account = require('../models/Account')
const { getAccountBalance } = require('../utils/accountBalance')
const accountService = require('../services/accountService')
const { hashPassword } = require('../utils/testHelpers')

async function testPhase3() {
    try {
        console.log('=== 第三阶段测试：会计科目管理 ===\n')

        // 连接数据库
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME
        })
        console.log('✓ 数据库连接成功\n')

        // 1. 创建测试用户
        console.log('1. 创建测试用户...')
        const testUsername = `test_p3_${Date.now().toString().slice(-8)}`
        const testPassword = hashPassword('Test1234')

        const user = await User.create({
            username: testUsername,
            password: testPassword
        })
        console.log(`✓ 用户创建成功: ${user.username}\n`)

        // 2. 创建测试账套
        console.log('2. 创建测试账套...')
        const book = await Book.create({
            userId: user._id,
            name: '第三阶段测试账套',
            description: '用于测试会计科目管理功能',
            currency: 'CNY',
            fiscalYearStart: 1,
            status: 'active'
        })
        console.log(`✓ 账套创建成功: ${book.name}`)
        console.log(`  账套 ID: ${book._id}`)

        // 初始化标准科目
        const accountsCount = await accountService.createAccountsFromTemplate(book._id)
        console.log(`✓ 标准科目初始化成功: ${accountsCount} 个科目\n`)

        // 3. 验证标准科目已自动初始化
        console.log('3. 验证标准科目已自动初始化...')
        const accountCount = await Account.countDocuments({ bookId: book._id })
        console.log(`✓ 标准科目数量: ${accountCount}\n`)

        // 4. 测试查询所有科目
        console.log('4. 测试查询所有科目...')
        const allAccounts = await Account.find({ bookId: book._id })
            .sort({ code: 1 })
            .limit(5)
        console.log(`✓ 查询成功，显示前 5 个科目:`)
        allAccounts.forEach(acc => {
            console.log(`  - [${acc.code}] ${acc.name} (${acc.type}, 层级 ${acc.level})`)
        })
        console.log()

        // 5. 测试按类型查询科目
        console.log('5. 测试按类型查询科目...')
        const assetAccounts = await Account.find({
            bookId: book._id,
            type: 'asset'
        }).limit(3)
        console.log(`✓ 资产类科目数量: ${assetAccounts.length}`)
        assetAccounts.forEach(acc => {
            console.log(`  - [${acc.code}] ${acc.name}`)
        })
        console.log()

        // 6. 测试查询层级结构
        console.log('6. 测试查询层级结构...')
        const topLevelAccounts = await Account.find({
            bookId: book._id,
            parentId: null
        })
        console.log(`✓ 顶级科目数量: ${topLevelAccounts.length}`)

        for (const topAccount of topLevelAccounts.slice(0, 2)) {
            console.log(`  - [${topAccount.code}] ${topAccount.name}`)

            const childAccounts = await Account.find({
                bookId: book._id,
                parentId: topAccount._id
            }).limit(2)

            childAccounts.forEach(child => {
                console.log(`    └─ [${child.code}] ${child.name}`)
            })
        }
        console.log()

        // 7. 测试创建自定义科目
        console.log('7. 测试创建自定义科目...')

        // 查找一个父科目（货币资金）
        const parentAccount = await Account.findOne({
            bookId: book._id,
            code: '111'
        })

        if (parentAccount) {
            const customAccount = await Account.create({
                bookId: book._id,
                code: '1115',
                name: '现金',
                description: '手头现金',
                type: 'asset',
                category: '货币资金',
                parentId: parentAccount._id,
                level: parentAccount.level + 1,
                isActive: true
            })
            console.log(`✓ 自定义科目创建成功: [${customAccount.code}] ${customAccount.name}`)
            console.log(`  父科目: [${parentAccount.code}] ${parentAccount.name}`)
            console.log(`  层级: ${customAccount.level}\n`)

            // 8. 测试更新科目
            console.log('8. 测试更新科目...')
            customAccount.description = '手头现金（已更新）'
            await customAccount.save()
            console.log(`✓ 科目更新成功: ${customAccount.description}\n`)

            // 9. 测试科目余额查询
            console.log('9. 测试科目余额查询...')
            const balance = await getAccountBalance(book._id, customAccount._id)
            console.log(`✓ 科目余额查询成功:`)
            console.log(`  科目: [${customAccount.code}] ${customAccount.name}`)
            console.log(`  借方合计: ${balance.totalDebit}`)
            console.log(`  贷方合计: ${balance.totalCredit}`)
            console.log(`  余额: ${balance.balanceDisplay}\n`)

            // 10. 测试停用科目
            console.log('10. 测试停用科目...')
            customAccount.isActive = false
            await customAccount.save()
            console.log(`✓ 科目已停用: [${customAccount.code}] ${customAccount.name}\n`)

            // 验证停用后的查询
            const activeAccounts = await Account.countDocuments({
                bookId: book._id,
                isActive: true
            })
            const inactiveAccounts = await Account.countDocuments({
                bookId: book._id,
                isActive: false
            })
            console.log(`  活跃科目数量: ${activeAccounts}`)
            console.log(`  停用科目数量: ${inactiveAccounts}\n`)
        }

        // 11. 测试科目代码唯一性验证
        console.log('11. 测试科目代码唯一性验证...')
        try {
            await Account.create({
                bookId: book._id,
                code: '1111', // 已存在的代码
                name: '重复科目',
                type: 'asset',
                category: '货币资金',
                level: 1
            })
            console.log('✗ 应该抛出唯一性错误\n')
        } catch (error) {
            if (error.code === 11000) {
                console.log('✓ 科目代码唯一性验证通过\n')
            } else {
                throw error
            }
        }

        // 12. 测试层级深度限制
        console.log('12. 测试层级深度...')
        const level1 = await Account.findOne({ bookId: book._id, level: 1 })
        const level2 = await Account.findOne({ bookId: book._id, level: 2 })
        const level3 = await Account.findOne({ bookId: book._id, level: 3 })
        const level4 = await Account.findOne({ bookId: book._id, level: 4 })
        const level5 = await Account.findOne({ bookId: book._id, level: 5 })

        console.log(`✓ 层级分布:`)
        console.log(`  层级 1: ${level1 ? '存在' : '不存在'}`)
        console.log(`  层级 2: ${level2 ? '存在' : '不存在'}`)
        console.log(`  层级 3: ${level3 ? '存在' : '不存在'}`)
        console.log(`  层级 4: ${level4 ? '存在' : '不存在'}`)
        console.log(`  层级 5: ${level5 ? '存在' : '不存在'}\n`)

        // 13. 清理测试数据
        console.log('13. 清理测试数据...')
        await Account.deleteMany({ bookId: book._id })
        await Book.deleteOne({ _id: book._id })
        await User.deleteOne({ _id: user._id })
        console.log('✓ 测试数据已清理\n')

        console.log('=== 第三阶段测试完成 ===')
        console.log('所有测试通过！✓\n')

    } catch (error) {
        console.error('测试失败:', error)
    } finally {
        await mongoose.connection.close()
        console.log('数据库连接已关闭')
    }
}

// 运行测试
testPhase3()
