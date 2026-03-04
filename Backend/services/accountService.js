const Account = require('../models/Account')
const accountTemplate = require('../utils/accountTemplate')

/**
 * 批量创建账套的会计科目
 * @param {ObjectId} bookId - 账套 ID
 * @returns {Promise<number>} 创建的科目数量
 */
async function createAccountsFromTemplate(bookId) {
    const accountMap = new Map()
    const accountsToCreate = []

    // 按层级分组，确保父节点先创建
    const levels = {}
    accountTemplate.forEach(template => {
        if (!levels[template.level]) {
            levels[template.level] = []
        }
        levels[template.level].push(template)
    })

    // 按层级顺序创建科目
    for (let level = 1; level <= 5; level++) {
        if (!levels[level]) continue

        const batch = levels[level].map(template => {
            let parentId = null
            if (template.parentCode) {
                const parentAccount = accountMap.get(template.parentCode)
                if (parentAccount) {
                    parentId = parentAccount._id
                }
            }

            return {
                bookId,
                code: template.code,
                name: template.name,
                type: template.type,
                category: template.category,
                level: template.level,
                parentId,
                isActive: true
            }
        })

        // 批量插入当前层级的所有科目
        const createdAccounts = await Account.insertMany(batch)

        // 更新 accountMap
        createdAccounts.forEach((account, index) => {
            accountMap.set(levels[level][index].code, account)
        })
    }

    return accountMap.size
}

module.exports = {
    createAccountsFromTemplate
}
