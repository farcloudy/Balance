const mongoose = require('mongoose')
const { ACCOUNT_CONSTANTS } = require('../constants')

/**
 * 查询科目余额（核心方法）
 *
 * @param {ObjectId} bookId - 账套 ID
 * @param {ObjectId} accountId - 科目 ID
 * @param {Date} asOfDate - 截止日期（默认当前日期）
 * @returns {Object} 余额信息
 */
async function getAccountBalance(bookId, accountId, asOfDate = new Date()) {
    try {
        // 尝试加载 Entry 模型（第四阶段才会创建）
        let Entry
        try {
            Entry = mongoose.model('Entry')
        } catch (error) {
            // Entry 模型尚未创建，返回零余额
            return {
                accountId,
                asOfDate,
                totalDebit: 0,
                totalCredit: 0,
                balance: 0,
                balanceDisplay: '0.00'
            }
        }

        // 使用聚合管道直接计算总和（避免加载所有分录到内存）
        const result = await Entry.aggregate([
            {
                $match: {
                    bookId,
                    accountId,
                    date: { $lte: asOfDate },
                    status: { $in: ['posted', 'reversed'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDebit: { $sum: '$debit' },
                    totalCredit: { $sum: '$credit' }
                }
            }
        ])

        const { totalDebit = 0, totalCredit = 0 } = result[0] || {}

        // 计算余额（借方余额为正，贷方余额为负）
        const balance = totalDebit - totalCredit

        return {
            accountId,
            asOfDate,
            totalDebit,
            totalCredit,
            balance,
            balanceDisplay: (balance / ACCOUNT_CONSTANTS.CURRENCY_MULTIPLIER).toFixed(2)
        }
    } catch (error) {
        throw new Error(`查询科目余额失败: ${error.message}`)
    }
}

/**
 * 批量查询多个科目的余额
 *
 * @param {ObjectId} bookId - 账套 ID
 * @param {Array<ObjectId>} accountIds - 科目 ID 数组
 * @param {Date} asOfDate - 截止日期
 * @returns {Array<Object>} 余额信息数组
 */
async function getAccountBalances(bookId, accountIds, asOfDate = new Date()) {
    return Promise.all(
        accountIds.map(accountId => getAccountBalance(bookId, accountId, asOfDate))
    )
}

module.exports = {
    getAccountBalance,
    getAccountBalances
}
