const mongoose = require('mongoose')
const User = require('../models/User')
const Book = require('../models/Book')
const Account = require('../models/Account')
const Entry = require('../models/Entry')
const { generateVoucherNo } = require('../utils/voucherNo')
const {
    validateBalance,
    validateAccounts,
    validateDate,
    validateEntries
} = require('../utils/validation')
require('dotenv').config()

/**
 * 第四阶段测试脚本：分录和凭证管理
 */

async function testPhase4() {
    try {
        console.log('=== 第四阶段测试：分录和凭证管理 ===\n')

        // 连接数据库
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✓ 数据库连接成功\n')

        // 1. 准备测试数据
        console.log('1. 准备测试数据...')
        const testUser = await User.findOne({ username: 'admin' })
        if (!testUser) {
            throw new Error('测试用户不存在，请先运行 initAdmin.js')
        }
        console.log(`✓ 找到测试用户: ${testUser.username}`)

        const testBook = await Book.findOne({ userId: testUser._id, status: 'active' })
        if (!testBook) {
            throw new Error('测试账套不存在，请先运行 testPhase2.js')
        }
        console.log(`✓ 找到测试账套: ${testBook.name}\n`)

        // 获取测试用的科目
        const bankAccount = await Account.findOne({ bookId: testBook._id, code: '1111' })
        const alipayAccount = await Account.findOne({ bookId: testBook._id, code: '1112' })
        const incomeAccount = await Account.findOne({ bookId: testBook._id, code: '41' })
        const expenseAccount = await Account.findOne({ bookId: testBook._id, code: '51' })

        if (!bankAccount || !alipayAccount || !incomeAccount || !expenseAccount) {
            throw new Error('测试科目不存在')
        }
        console.log('✓ 找到测试科目')
        console.log(`  - 银行存款: ${bankAccount.code} ${bankAccount.name}`)
        console.log(`  - 支付宝: ${alipayAccount.code} ${alipayAccount.name}`)
        console.log(`  - 工资收入: ${incomeAccount.code} ${incomeAccount.name}`)
        console.log(`  - 餐饮支出: ${expenseAccount.code} ${expenseAccount.name}\n`)

        // 2. 测试凭证号生成
        console.log('2. 测试凭证号生成...')
        const voucherNo1 = await generateVoucherNo(testBook._id)
        console.log(`✓ 生成凭证号: ${voucherNo1}`)

        // 创建一个临时分录以测试凭证号递增
        await Entry.create({
            bookId: testBook._id,
            voucherNo: voucherNo1,
            accountId: bankAccount._id,
            debit: 100,
            credit: 0,
            description: '测试凭证号',
            date: new Date(),
            createdBy: testUser._id
        })

        const voucherNo2 = await generateVoucherNo(testBook._id)
        console.log(`✓ 生成凭证号: ${voucherNo2}`)
        if (voucherNo1 === voucherNo2) {
            throw new Error('凭证号重复')
        }
        console.log('✓ 凭证号唯一性验证通过\n')

        // 3. 测试创建简单凭证（一借一贷）
        console.log('3. 测试创建简单凭证（一借一贷）...')
        const simpleEntries = [
            {
                accountId: bankAccount._id,
                debit: 5000,  // 50.00 元
                credit: 0,
                description: '餐饮支出',
                date: new Date(),
                type: 'expense',
                counterparty: '某餐厅'
            },
            {
                accountId: expenseAccount._id,
                debit: 0,
                credit: 5000,
                description: '餐饮支出',
                date: new Date(),
                type: 'expense',
                counterparty: '某餐厅'
            }
        ]

        const entriesValidation = validateEntries(simpleEntries)
        if (!entriesValidation.isValid) {
            throw new Error(`分录验证失败: ${entriesValidation.errors.join(', ')}`)
        }
        console.log('✓ 分录数据验证通过')

        const balanceValidation = validateBalance(simpleEntries)
        if (!balanceValidation.isValid) {
            throw new Error('借贷不平衡')
        }
        console.log('✓ 借贷平衡验证通过')

        const voucherNo3 = await generateVoucherNo(testBook._id)
        const simpleEntryDocs = simpleEntries.map(entry => ({
            bookId: testBook._id,
            voucherNo: voucherNo3,
            ...entry,
            createdBy: testUser._id
        }))

        const createdSimpleEntries = await Entry.insertMany(simpleEntryDocs)
        console.log(`✓ 创建简单凭证成功: ${voucherNo3}`)
        console.log(`  - 共 ${createdSimpleEntries.length} 条分录\n`)

        // 4. 测试创建复杂凭证（多借多贷）
        console.log('4. 测试创建复杂凭证（多借多贷）...')
        const complexEntries = [
            {
                accountId: bankAccount._id,
                debit: 800000,  // 8000.00 元
                credit: 0,
                description: '工资收入',
                date: new Date(),
                type: 'income',
                counterparty: '某公司'
            },
            {
                accountId: alipayAccount._id,
                debit: 200000,  // 2000.00 元
                credit: 0,
                description: '工资收入',
                date: new Date(),
                type: 'income',
                counterparty: '某公司'
            },
            {
                accountId: incomeAccount._id,
                debit: 0,
                credit: 1000000,  // 10000.00 元
                description: '工资收入',
                date: new Date(),
                type: 'income',
                counterparty: '某公司'
            }
        ]

        const complexValidation = validateBalance(complexEntries)
        if (!complexValidation.isValid) {
            throw new Error('借贷不平衡')
        }
        console.log('✓ 复杂凭证借贷平衡验证通过')

        const voucherNo4 = await generateVoucherNo(testBook._id)
        const complexEntryDocs = complexEntries.map(entry => ({
            bookId: testBook._id,
            voucherNo: voucherNo4,
            ...entry,
            createdBy: testUser._id
        }))

        const createdComplexEntries = await Entry.insertMany(complexEntryDocs)
        console.log(`✓ 创建复杂凭证成功: ${voucherNo4}`)
        console.log(`  - 共 ${createdComplexEntries.length} 条分录`)
        console.log(`  - 借方合计: ${(complexValidation.totalDebit / 100).toFixed(2)} 元`)
        console.log(`  - 贷方合计: ${(complexValidation.totalCredit / 100).toFixed(2)} 元\n`)

        // 5. 测试借贷不平衡的错误处理
        console.log('5. 测试借贷不平衡的错误处理...')
        const unbalancedEntries = [
            {
                accountId: bankAccount._id,
                debit: 10000,
                credit: 0,
                description: '测试不平衡',
                date: new Date()
            },
            {
                accountId: expenseAccount._id,
                debit: 0,
                credit: 5000,  // 故意不平衡
                description: '测试不平衡',
                date: new Date()
            }
        ]

        const unbalancedValidation = validateBalance(unbalancedEntries)
        if (unbalancedValidation.isValid) {
            throw new Error('应该检测到借贷不平衡')
        }
        console.log('✓ 成功检测到借贷不平衡')
        console.log(`  - 差额: ${(unbalancedValidation.difference / 100).toFixed(2)} 元\n`)

        // 6. 测试凭证过账
        console.log('6. 测试凭证过账...')
        const draftVoucherNo = await generateVoucherNo(testBook._id)
        const draftEntries = [
            {
                bookId: testBook._id,
                voucherNo: draftVoucherNo,
                accountId: bankAccount._id,
                debit: 10000,
                credit: 0,
                description: '测试过账',
                date: new Date(),
                status: 'draft',
                createdBy: testUser._id
            },
            {
                bookId: testBook._id,
                voucherNo: draftVoucherNo,
                accountId: expenseAccount._id,
                debit: 0,
                credit: 10000,
                description: '测试过账',
                date: new Date(),
                status: 'draft',
                createdBy: testUser._id
            }
        ]

        await Entry.insertMany(draftEntries)
        console.log(`✓ 创建草稿凭证: ${draftVoucherNo}`)

        await Entry.updateMany(
            { voucherNo: draftVoucherNo },
            { status: 'posted' }
        )
        console.log('✓ 凭证过账成功\n')

        // 7. 测试凭证冲销
        console.log('7. 测试凭证冲销...')
        const originalVoucherNo = await generateVoucherNo(testBook._id)
        const originalEntries = [
            {
                bookId: testBook._id,
                voucherNo: originalVoucherNo,
                accountId: bankAccount._id,
                debit: 20000,
                credit: 0,
                description: '测试冲销',
                date: new Date(),
                status: 'posted',
                createdBy: testUser._id
            },
            {
                bookId: testBook._id,
                voucherNo: originalVoucherNo,
                accountId: expenseAccount._id,
                debit: 0,
                credit: 20000,
                description: '测试冲销',
                date: new Date(),
                status: 'posted',
                createdBy: testUser._id
            }
        ]

        await Entry.insertMany(originalEntries)
        console.log(`✓ 创建原始凭证: ${originalVoucherNo}`)

        // 生成冲销凭证
        const reversalVoucherNo = await generateVoucherNo(testBook._id)
        const reversalEntries = originalEntries.map(entry => ({
            ...entry,
            voucherNo: reversalVoucherNo,
            debit: entry.credit,  // 借贷互换
            credit: entry.debit,
            description: `冲销：${entry.description}`,
            tags: ['冲销']
        }))

        await Entry.insertMany(reversalEntries)
        await Entry.updateMany(
            { voucherNo: originalVoucherNo },
            { status: 'reversed' }
        )
        console.log(`✓ 创建冲销凭证: ${reversalVoucherNo}`)
        console.log('✓ 原凭证标记为已冲销\n')

        // 8. 测试查询凭证
        console.log('8. 测试查询凭证...')
        const allEntries = await Entry.find({ bookId: testBook._id })
            .populate('accountId', 'code name')
            .sort({ voucherNo: 1 })

        console.log(`✓ 查询到 ${allEntries.length} 条分录`)

        // 按凭证号分组
        const voucherGroups = {}
        allEntries.forEach(entry => {
            if (!voucherGroups[entry.voucherNo]) {
                voucherGroups[entry.voucherNo] = []
            }
            voucherGroups[entry.voucherNo].push(entry)
        })

        console.log(`✓ 共 ${Object.keys(voucherGroups).length} 笔凭证`)
        Object.entries(voucherGroups).forEach(([voucherNo, entries]) => {
            const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
            const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)
            console.log(`  - ${voucherNo}: ${entries.length} 条分录, 状态: ${entries[0].status}, 借: ${(totalDebit / 100).toFixed(2)}, 贷: ${(totalCredit / 100).toFixed(2)}`)
        })
        console.log()

        // 9. 测试科目验证
        console.log('9. 测试科目验证...')
        const validAccountIds = [bankAccount._id, alipayAccount._id]
        const accountsValidation = await validateAccounts(testBook._id, validAccountIds)
        if (!accountsValidation.isValid) {
            throw new Error('科目验证失败')
        }
        console.log('✓ 有效科目验证通过')

        const invalidAccountIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
        const invalidAccountsValidation = await validateAccounts(testBook._id, invalidAccountIds)
        if (invalidAccountsValidation.isValid) {
            throw new Error('应该检测到无效科目')
        }
        console.log('✓ 成功检测到无效科目\n')

        // 10. 测试日期验证
        console.log('10. 测试日期验证...')
        const validDate = new Date()
        const validDateValidation = validateDate(validDate)
        if (!validDateValidation.isValid) {
            throw new Error('有效日期验证失败')
        }
        console.log('✓ 有效日期验证通过')

        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1)
        const futureDateValidation = validateDate(futureDate)
        if (futureDateValidation.isValid) {
            throw new Error('应该检测到未来日期')
        }
        console.log('✓ 成功检测到未来日期\n')

        console.log('=== 第四阶段测试全部通过 ✓ ===\n')
        console.log('测试总结:')
        console.log('✓ 凭证号生成和唯一性')
        console.log('✓ 简单凭证创建（一借一贷）')
        console.log('✓ 复杂凭证创建（多借多贷）')
        console.log('✓ 借贷平衡验证')
        console.log('✓ 凭证过账')
        console.log('✓ 凭证冲销')
        console.log('✓ 凭证查询和分组')
        console.log('✓ 科目有效性验证')
        console.log('✓ 日期合理性验证')

    } catch (error) {
        console.error('\n✗ 测试失败:', error.message)
        console.error(error)
    } finally {
        await mongoose.connection.close()
        console.log('\n数据库连接已关闭')
    }
}

// 运行测试
testPhase4()
