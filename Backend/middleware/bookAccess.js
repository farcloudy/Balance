const Book = require('../models/Book')

const bookAccess = async (req, res, next) => {
    try {
        const bookId = req.params.bookId || req.params.id

        if (!bookId) {
            return res.status(400).json({
                success: false,
                error: '缺少账套 ID'
            })
        }

        const book = await Book.findOne({
            _id: bookId,
            userId: req.userId
        })

        if (!book) {
            return res.status(404).json({
                success: false,
                error: '账套不存在或无权访问'
            })
        }

        req.book = book
        next()
    } catch (error) {
        console.error('账套权限验证错误:', error)
        res.status(500).json({
            success: false,
            error: '服务器错误'
        })
    }
}

module.exports = bookAccess
