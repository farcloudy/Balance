const Account = require('../models/Account')

/**
 * 验证凭证的借贷平衡
 * @param {Array} entries - 分录数组
 * @returns {Object} { isValid: boolean, totalDebit: number, totalCredit: number, difference: number }
 */
function validateBalance(entries) {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0)
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0)
    const difference = totalDebit - totalCredit

    return {
        isValid: difference === 0,
        totalDebit,
        totalCredit,
        difference
    }
}

/**
 * 验证科目是否有效且属于指定账套
 * @param {ObjectId} bookId - 账套 ID
 * @param {Array} accountIds - 科目 ID 数组
 * @returns {Promise<Object>} { isValid: boolean, invalidAccounts: Array }
 */
async function validateAccounts(bookId, accountIds) {
    const uniqueAccountIds = [...new Set(accountIds.map(id => id.toString()))]

    const accounts = await Account.find({
        _id: { $in: uniqueAccountIds },
        bookId,
        isActive: true
    }).select('_id')

    const foundIds = accounts.map(acc => acc._id.toString())
    const invalidAccounts = uniqueAccountIds.filter(id => !foundIds.includes(id))

    return {
        isValid: invalidAccounts.length === 0,
        invalidAccounts
    }
}

/**
 * 验证日期合理性
 * @param {Date} date - 交易日期
 * @returns {Object} { isValid: boolean, error: string }
 */
function validateDate(date) {
    const transactionDate = new Date(date)
    const now = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(now.getFullYear() - 1)

    // 不能是未来日期
    if (transactionDate > now) {
        return {
            isValid: false,
            error: '交易日期不能是未来日期'
        }
    }

    // 警告：超过一年的历史数据
    if (transactionDate < oneYearAgo) {
        return {
            isValid: true,
            warning: '交易日期超过一年，请确认是否正确'
        }
    }

    return { isValid: true }
}

/**
 * 验证分录数据完整性
 * @param {Array} entries - 分录数组
 * @returns {Object} { isValid: boolean, errors: Array }
 */
function validateEntries(entries) {
    const errors = []

    if (!entries || entries.length === 0) {
        errors.push('分录不能为空')
        return { isValid: false, errors }
    }

    if (entries.length < 2) {
        errors.push('至少需要两条分录（一借一贷）')
        return { isValid: false, errors }
    }

    entries.forEach((entry, index) => {
        // 验证必填字段
        if (!entry.accountId) {
            errors.push(`第 ${index + 1} 条分录缺少科目`)
        }
        if (!entry.description) {
            errors.push(`第 ${index + 1} 条分录缺少摘要`)
        }
        if (!entry.date) {
            errors.push(`第 ${index + 1} 条分录缺少日期`)
        }

        // 验证金额
        const debit = entry.debit || 0
        const credit = entry.credit || 0

        if (debit < 0 || credit < 0) {
            errors.push(`第 ${index + 1} 条分录金额不能为负数`)
        }

        if (debit === 0 && credit === 0) {
            errors.push(`第 ${index + 1} 条分录借方和贷方不能同时为 0`)
        }

        if (debit > 0 && credit > 0) {
            errors.push(`第 ${index + 1} 条分录借方和贷方不能同时有值`)
        }
    })

    return {
        isValid: errors.length === 0,
        errors
    }
}

module.exports = {
    validateBalance,
    validateAccounts,
    validateDate,
    validateEntries
}
