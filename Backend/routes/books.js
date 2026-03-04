const express = require('express')
const router = express.Router()
const Book = require('../models/Book')
const auth = require('../middleware/auth')
const bookAccess = require('../middleware/bookAccess')
const { BOOK_STATUS, DEFAULT_CURRENCY, DEFAULT_FISCAL_YEAR_START } = require('../constants')
const accountService = require('../services/accountService')

// 创建账套
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, currency, fiscalYearStart } = req.body

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: '账套名称不能为空'
            })
        }

        const book = await Book.create({
            userId: req.userId,
            name: name.trim(),
            description: description?.trim() || '',
            currency: currency || DEFAULT_CURRENCY,
            fiscalYearStart: fiscalYearStart || DEFAULT_FISCAL_YEAR_START
        })

        const accountsCount = await accountService.createAccountsFromTemplate(book._id)

        res.status(201).json({
            success: true,
            data: {
                book,
                accountsCount
            }
        })
    } catch (error) {
        console.error('创建账套错误:', error)
        res.status(500).json({
            success: false,
            error: '创建账套失败'
        })
    }
})

// 获取用户的所有账套
router.get('/', auth, async (req, res) => {
    try {
        const { status } = req.query

        const filter = { userId: req.userId }
        if (status) {
            filter.status = status
        }

        const books = await Book.find(filter).sort({ createdAt: -1 })

        res.json({
            success: true,
            data: books
        })
    } catch (error) {
        console.error('获取账套列表错误:', error)
        res.status(500).json({
            success: false,
            error: '获取账套列表失败'
        })
    }
})

// 获取单个账套详情
router.get('/:id', auth, bookAccess, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.book
        })
    } catch (error) {
        console.error('获取账套详情错误:', error)
        res.status(500).json({
            success: false,
            error: '获取账套详情失败'
        })
    }
})

// 更新账套信息
router.put('/:id', auth, bookAccess, async (req, res) => {
    try {
        const { name, description, currency, fiscalYearStart, status } = req.body

        if (name !== undefined) {
            if (name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '账套名称不能为空'
                })
            }
            req.book.name = name.trim()
        }
        if (description !== undefined) req.book.description = description.trim()
        if (currency !== undefined) req.book.currency = currency
        if (fiscalYearStart !== undefined) req.book.fiscalYearStart = fiscalYearStart
        if (status !== undefined) req.book.status = status

        await req.book.save()

        res.json({
            success: true,
            data: req.book
        })
    } catch (error) {
        console.error('更新账套错误:', error)
        res.status(500).json({
            success: false,
            error: '更新账套失败'
        })
    }
})

// 删除/归档账套
router.delete('/:id', auth, bookAccess, async (req, res) => {
    try {
        req.book.status = BOOK_STATUS.ARCHIVED
        await req.book.save()

        res.json({
            success: true,
            message: '账套已归档'
        })
    } catch (error) {
        console.error('归档账套错误:', error)
        res.status(500).json({
            success: false,
            error: '归档账套失败'
        })
    }
})

module.exports = router
