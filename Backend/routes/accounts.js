const express = require('express')
const router = express.Router()
const Account = require('../models/Account')
const { getAccountBalance } = require('../utils/accountBalance')
const auth = require('../middleware/auth')
const bookAccess = require('../middleware/bookAccess')
const { ACCOUNT_CONSTANTS, QUERY_PARAMS } = require('../constants')

// 所有路由都需要认证和账套权限验证
router.use(auth)
router.use('/:bookId/*', bookAccess)

/**
 * GET /api/books/:bookId/accounts
 * 获取账套的所有科目
 */
router.get('/:bookId/accounts', async (req, res) => {
    try {
        const { bookId } = req.params
        const { type, parentId, isActive, includeBalance } = req.query

        // 构建查询条件
        const query = { bookId }

        if (type) {
            query.type = type
        }

        if (parentId !== undefined) {
            query.parentId = parentId === QUERY_PARAMS.NULL ? null : parentId
        }

        if (isActive !== undefined) {
            query.isActive = isActive === QUERY_PARAMS.TRUE
        }

        // 查询科目
        const accounts = await Account.find(query)
            .sort({ code: 1 })
            .lean()

        // 如果需要包含余额信息
        if (includeBalance === QUERY_PARAMS.TRUE) {
            const accountsWithBalance = await Promise.all(
                accounts.map(async (account) => {
                    const balance = await getAccountBalance(bookId, account._id)
                    return {
                        ...account,
                        balance: balance.balance,
                        balanceDisplay: balance.balanceDisplay
                    }
                })
            )
            return res.json({
                success: true,
                data: accountsWithBalance
            })
        }

        res.json({
            success: true,
            data: accounts
        })
    } catch (error) {
        console.error('获取科目列表失败:', error)
        res.status(500).json({
            success: false,
            error: '获取科目列表失败'
        })
    }
})

/**
 * GET /api/books/:bookId/accounts/:id
 * 获取单个科目详情
 */
router.get('/:bookId/accounts/:id', async (req, res) => {
    try {
        const { bookId, id } = req.params
        const { includeBalance } = req.query

        const account = await Account.findOne({
            _id: id,
            bookId
        }).lean()

        if (!account) {
            return res.status(404).json({
                success: false,
                error: '科目不存在'
            })
        }

        // 如果需要包含余额信息
        if (includeBalance === QUERY_PARAMS.TRUE) {
            const balance = await getAccountBalance(bookId, account._id)
            account.balance = balance.balance
            account.balanceDisplay = balance.balanceDisplay
            account.totalDebit = balance.totalDebit
            account.totalCredit = balance.totalCredit
        }

        res.json({
            success: true,
            data: account
        })
    } catch (error) {
        console.error('获取科目详情失败:', error)
        res.status(500).json({
            success: false,
            error: '获取科目详情失败'
        })
    }
})

/**
 * POST /api/books/:bookId/accounts
 * 创建自定义科目
 */
router.post('/:bookId/accounts', async (req, res) => {
    try {
        const { bookId } = req.params
        const { code, name, description, type, category, parentId, level } = req.body

        // 验证必填字段
        if (!code || !name || !type) {
            return res.status(400).json({
                success: false,
                error: '科目代码、名称和类型为必填项'
            })
        }

        // 验证科目代码唯一性
        const existingAccount = await Account.findOne({ bookId, code })
        if (existingAccount) {
            return res.status(400).json({
                success: false,
                error: '科目代码已存在'
            })
        }

        // 如果指定了父科目，验证父科目存在
        if (parentId) {
            const parentAccount = await Account.findOne({
                _id: parentId,
                bookId
            })

            if (!parentAccount) {
                return res.status(400).json({
                    success: false,
                    error: '父科目不存在'
                })
            }

            // 验证父科目类型一致
            if (parentAccount.type !== type) {
                return res.status(400).json({
                    success: false,
                    error: '子科目类型必须与父科目类型一致'
                })
            }

            // 验证层级深度（最多 5 层）
            if (parentAccount.level >= ACCOUNT_CONSTANTS.MAX_LEVEL) {
                return res.status(400).json({
                    success: false,
                    error: '科目层级不能超过 5 层'
                })
            }
        }

        // 创建科目
        const account = await Account.create({
            bookId,
            code,
            name,
            description,
            type,
            category,
            parentId: parentId || null,
            level: level || (parentId ? undefined : 1),
            isActive: true
        })

        res.status(201).json({
            success: true,
            data: account
        })
    } catch (error) {
        console.error('创建科目失败:', error)
        res.status(500).json({
            success: false,
            error: '创建科目失败'
        })
    }
})

/**
 * PUT /api/books/:bookId/accounts/:id
 * 更新科目信息
 */
router.put('/:bookId/accounts/:id', async (req, res) => {
    try {
        const { bookId, id } = req.params
        const { name, description, category } = req.body

        // 查找科目
        const account = await Account.findOne({
            _id: id,
            bookId
        })

        if (!account) {
            return res.status(404).json({
                success: false,
                error: '科目不存在'
            })
        }

        // 只允许更新部分字段（code、type、parentId、level 不可修改）
        if (name) account.name = name
        if (description !== undefined) account.description = description
        if (category) account.category = category

        await account.save()

        res.json({
            success: true,
            data: account
        })
    } catch (error) {
        console.error('更新科目失败:', error)
        res.status(500).json({
            success: false,
            error: '更新科目失败'
        })
    }
})

/**
 * DELETE /api/books/:bookId/accounts/:id
 * 停用科目（软删除）
 */
router.delete('/:bookId/accounts/:id', async (req, res) => {
    try {
        const { bookId, id } = req.params

        // 查找科目
        const account = await Account.findOne({
            _id: id,
            bookId
        })

        if (!account) {
            return res.status(404).json({
                success: false,
                error: '科目不存在'
            })
        }

        // 检查是否有子科目
        const childAccounts = await Account.countDocuments({
            bookId,
            parentId: id,
            isActive: true
        })

        if (childAccounts > 0) {
            return res.status(400).json({
                success: false,
                error: '该科目下有子科目，无法停用'
            })
        }

        // 停用科目（软删除）
        account.isActive = false
        await account.save()

        res.json({
            success: true,
            message: '科目已停用'
        })
    } catch (error) {
        console.error('停用科目失败:', error)
        res.status(500).json({
            success: false,
            error: '停用科目失败'
        })
    }
})

module.exports = router
