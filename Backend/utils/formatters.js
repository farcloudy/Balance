/**
 * 格式化金额（从分转换为元）
 * @param {number} amount - 金额（分）
 * @returns {string} 格式化后的金额（元）
 */
function formatAmount(amount) {
    return (amount / 100).toFixed(2)
}

/**
 * 格式化分录对象，添加显示字段
 * @param {Object} entry - 分录对象
 * @returns {Object} 包含显示字段的分录对象
 */
function formatEntry(entry) {
    return {
        ...entry,
        debitDisplay: formatAmount(entry.debit),
        creditDisplay: formatAmount(entry.credit)
    }
}

/**
 * 格式化借贷平衡详情
 * @param {Object} validation - 验证结果对象
 * @returns {Object} 格式化后的平衡详情
 */
function formatBalanceDetails(validation) {
    return {
        totalDebit: formatAmount(validation.totalDebit),
        totalCredit: formatAmount(validation.totalCredit),
        difference: formatAmount(validation.difference)
    }
}

module.exports = {
    formatAmount,
    formatEntry,
    formatBalanceDetails
}
