const express = require('express')
const router = express.Router()
const Entry = require('../models/Entry')
const auth = require('../middleware/auth')
const bookAccess = require('../middleware/bookAccess')
const { generateVoucherNo } = require('../utils/voucherNo')
const {
    validateBalance,
    validateAccounts,
    validateDate,
    validateEntries
} = require('../utils/validation')
const { formatEntry, formatBalanceDetails } = require('../utils/formatters')
const { ENTRY_STATUS } = require('../constants/entryConstants')

/**
 * POST /api/books/:bookId/entries
 * 创建分录（支持多行，构成一笔完整凭证）
 */
router.post('/:bookId/entries', auth, bookAccess, async (req, res) => {
    try {
        const { bookId } = req.params
        const { entries } = req.body

        // 验证分录数据完整性
        const entriesValidation = validateEntries(entries)
        if (!entriesValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: '分录数据验证失败',
                details: entriesValidation.errors
            })
        }

        // 验证日期
        const dateValidation = validateDate(entries[0].date)
        if (!dateValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: dateValidation.error
            })
        }

        // 验证科目有效性
        const accountIds = entries.map(e => e.accountId)
        const accountsValidation = await validateAccounts(bookId, accountIds)
        if (!accountsValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: '科目验证失败',
                details: `无效的科目 ID: ${accountsValidation.invalidAccounts.join(', ')}`
            })
        }

        // 验证借贷平衡
        const balanceValidation = validateBalance(entries)
        if (!balanceValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: '凭证不平衡',
                details: formatBalanceDetails(balanceValidation)
            })
        }

        // 生成凭证号
        const voucherNo = await generateVoucherNo(bookId)

        // 创建分录
        const entryDocs = entries.map(entry => ({
            bookId,
            voucherNo,
            date: entry.date,
            description: entry.description,
            status: entry.status || 'draft',
            accountId: entry.accountId,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            type: entry.type || 'other',
            counterparty: entry.counterparty,
            tags: entry.tags || [],
            cashFlowAccount: entry.cashFlowAccount,
            attachments: entry.attachments || [],
            createdBy: req.userId
        }))

        const createdEntries = await Entry.insertMany(entryDocs)

        res.status(201).json({
            success: true,
            message: '凭证创建成功',
            voucherNo,
            entries: createdEntries.map(e => formatEntry(e.toObject())),
            warning: dateValidation.warning
        })
    } catch (error) {
        console.error('创建分录失败:', error)
        res.status(500).json({
            success: false,
            error: error.message || '创建分录失败'
        })
    }
})

/**
 * GET /api/books/:bookId/entries
 * 查询分录列表（支持分页和筛选）
 */
router.get('/:bookId/entries', auth, bookAccess, async (req, res) => {
    try {
        const { bookId } = req.params
        const {
            page = 1,
            limit = 20,
            status,
            startDate,
            endDate,
            accountId,
            type,
            voucherNo
        } = req.query

        // 构建查询条件
        const query = { bookId }

        if (status) query.status = status
        if (accountId) query.accountId = accountId
        if (type) query.type = type
        if (voucherNo) query.voucherNo = voucherNo

        if (startDate || endDate) {
            query.date = {}
            if (startDate) query.date.$gte = new Date(startDate)
            if (endDate) query.date.$lte = new Date(endDate)
        }

        // 分页
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // 并行查询数据和总数
        const [entries, total] = await Promise.all([
            Entry.find(query)
                .populate('accountId', 'code name type')
                .sort({ date: -1, voucherNo: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Entry.countDocuments(query)
        ])

        res.json({
            success: true,
            entries: entries.map(formatEntry),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        })
    } catch (error) {
        console.error('查询分录失败:', error)
        res.status(500).json({
            success: false,
            error: error.message || '查询分录失败'
        })
    }
})

/**
 * GET /api/books/:bookId/entries/:voucherNo
 * 获取凭证详情（包含该凭证的所有分录）
 */
router.get('/:bookId/entries/:voucherNo', auth, bookAccess, async (req, res) => {
    try {
        const { bookId, voucherNo } = req.params

        const entries = await Entry.find({ bookId, voucherNo })
            .populate('accountId', 'code name type')
            .populate('createdBy', 'username')
            .sort({ debit: -1 })
            .lean()

        if (entries.length === 0) {
            return res.status(404).json({
                success: false,
                error: '凭证不存在'
            })
        }

        // 计算借贷合计
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
        const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)

        res.json({
            success: true,
            voucherNo,
            status: entries[0].status,
            date: entries[0].date,
            entries: entries.map(formatEntry),
            summary: {
                ...formatBalanceDetails({
                    totalDebit,
                    totalCredit,
                    difference: totalDebit - totalCredit
                }),
                isBalanced: totalDebit === totalCredit
            }
        })
    } catch (error) {
        console.error('获取凭证详情失败:', error)
        res.status(500).json({
            success: false,
            error: error.message || '获取凭证详情失败'
        })
    }
})

/**
 * PUT /api/books/:bookId/entries/:voucherNo
 * 修改草稿凭证
 */
router.put('/:bookId/entries/:voucherNo', auth, bookAccess, async (req, res) => {
    try {
        const { bookId, voucherNo } = req.params
        const { entries } = req.body

        // 检查凭证状态
        const existingEntries = await Entry.find({ bookId, voucherNo })
        if (existingEntries.length === 0) {
            return res.status(404).json({
                success: false,
                error: '凭证不存在'
            })
        }

        if (existingEntries[0].status !== ENTRY_STATUS.DRAFT) {
            return res.status(400).json({
                success: false,
                error: '只能修改草稿状态的凭证'
            })
        }

        // 验证新的分录数据
        const entriesValidation = validateEntries(entries)
        if (!entriesValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: '分录数据验证失败',
                details: entriesValidation.errors
            })
        }

        // 验证科目有效性
        const accountIds = entries.map(e => e.accountId)
        const accountsValidation = await validateAccounts(bookId, accountIds)
        if (!accountsValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: '科目验证失败',
                details: `无效的科目 ID: ${accountsValidation.invalidAccounts.join(', ')}`
            })
        }

        // 验证借贷平衡
        const balanceValidation = validateBalance(entries)
        if (!balanceValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: '凭证不平衡',
                details: formatBalanceDetails(balanceValidation)
            })
        }

        // 删除旧的分录
        await Entry.deleteMany({ bookId, voucherNo })

        // 创建新的分录
        const entryDocs = entries.map(entry => ({
            bookId,
            voucherNo,
            date: entry.date,
            description: entry.description,
            status: ENTRY_STATUS.DRAFT,
            accountId: entry.accountId,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            type: entry.type || 'other',
            counterparty: entry.counterparty,
            tags: entry.tags || [],
            cashFlowAccount: entry.cashFlowAccount,
            attachments: entry.attachments || [],
            createdBy: req.userId
        }))

        const updatedEntries = await Entry.insertMany(entryDocs)

        res.json({
            success: true,
            message: '凭证修改成功',
            entries: updatedEntries.map(e => formatEntry(e.toObject()))
        })
    } catch (error) {
        console.error('修改凭证失败:', error)
        res.status(500).json({
            success: false,
            error: error.message || '修改凭证失败'
        })
    }
})

/**
 * POST /api/books/:bookId/entries/:voucherNo/post
 * 过账（将草稿凭证标记为已过账）
 */
router.post('/:bookId/entries/:voucherNo/post', auth, bookAccess, async (req, res) => {
    try {
        const { bookId, voucherNo } = req.params

        // 检查凭证状态
        const entries = await Entry.find({ bookId, voucherNo })
        if (entries.length === 0) {
            return res.status(404).json({
                success: false,
                error: '凭证不存在'
            })
        }

        if (entries[0].status !== ENTRY_STATUS.DRAFT) {
            return res.status(400).json({
                success: false,
                error: '只能过账草稿状态的凭证'
            })
        }

        // 再次验证借贷平衡
        const balanceValidation = validateBalance(entries)
        if (!balanceValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: '凭证不平衡，无法过账',
                details: formatBalanceDetails(balanceValidation)
            })
        }

        // 更新状态为已过账
        await Entry.updateMany(
            { bookId, voucherNo },
            { status: ENTRY_STATUS.POSTED, updatedAt: new Date() }
        )

        res.json({
            success: true,
            message: '凭证过账成功',
            voucherNo
        })
    } catch (error) {
        console.error('凭证过账失败:', error)
        res.status(500).json({
            success: false,
            error: error.message || '凭证过账失败'
        })
    }
})

/**
 * POST /api/books/:bookId/entries/:voucherNo/reverse
 * 冲销凭证（创建反向分录）
 */
router.post('/:bookId/entries/:voucherNo/reverse', auth, bookAccess, async (req, res) => {
    try {
        const { bookId, voucherNo } = req.params
        const { reversalDate, description } = req.body

        // 查询原凭证
        const originalEntries = await Entry.find({ bookId, voucherNo, status: ENTRY_STATUS.POSTED })
        if (originalEntries.length === 0) {
            return res.status(404).json({
                success: false,
                error: '凭证不存在或未过账'
            })
        }

        // 验证冲销日期
        const dateValidation = validateDate(reversalDate || new Date())
        if (!dateValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: dateValidation.error
            })
        }

        // 生成新的冲销凭证号
        const reversalVoucherNo = await generateVoucherNo(bookId)

        // 创建冲销分录（借贷方向相反）
        const reversalEntries = originalEntries.map(entry => ({
            bookId: entry.bookId,
            voucherNo: reversalVoucherNo,
            date: reversalDate ? new Date(reversalDate) : new Date(),
            description: description || `冲销：${entry.description}`,
            status: ENTRY_STATUS.POSTED,
            accountId: entry.accountId,
            debit: entry.credit,  // 借贷互换
            credit: entry.debit,
            type: entry.type,
            counterparty: entry.counterparty,
            tags: [...(entry.tags || []), '冲销'],
            cashFlowAccount: entry.cashFlowAccount,
            attachments: entry.attachments || [],
            createdBy: req.userId
        }))

        await Entry.insertMany(reversalEntries)

        // 标记原凭证为已冲销
        await Entry.updateMany(
            { bookId, voucherNo },
            { status: ENTRY_STATUS.REVERSED, updatedAt: new Date() }
        )

        res.json({
            success: true,
            message: '凭证冲销成功',
            originalVoucherNo: voucherNo,
            reversalVoucherNo
        })
    } catch (error) {
        console.error('凭证冲销失败:', error)
        res.status(500).json({
            success: false,
            error: error.message || '凭证冲销失败'
        })
    }
})

/**
 * DELETE /api/books/:bookId/entries/:voucherNo
 * 删除草稿凭证
 */
router.delete('/:bookId/entries/:voucherNo', auth, bookAccess, async (req, res) => {
    try {
        const { bookId, voucherNo } = req.params

        // 检查凭证状态
        const entries = await Entry.find({ bookId, voucherNo })
        if (entries.length === 0) {
            return res.status(404).json({
                success: false,
                error: '凭证不存在'
            })
        }

        if (entries[0].status !== ENTRY_STATUS.DRAFT) {
            return res.status(400).json({
                success: false,
                error: '只能删除草稿状态的凭证'
            })
        }

        // 删除所有分录
        await Entry.deleteMany({ bookId, voucherNo })

        res.json({
            success: true,
            message: '凭证删除成功',
            voucherNo
        })
    } catch (error) {
        console.error('删除凭证失败:', error)
        res.status(500).json({
            success: false,
            error: error.message || '删除凭证失败'
        })
    }
})

module.exports = router
