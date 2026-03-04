// 分录状态常量
const ENTRY_STATUS = {
    DRAFT: 'draft',
    POSTED: 'posted',
    REVERSED: 'reversed'
}

// 分录类型常量
const ENTRY_TYPE = {
    INCOME: 'income',
    EXPENSE: 'expense',
    TRANSFER: 'transfer',
    OTHER: 'other'
}

// 附件类型常量
const ATTACHMENT_TYPE = {
    IMAGE: 'image',
    DOCUMENT: 'document'
}

module.exports = {
    ENTRY_STATUS,
    ENTRY_TYPE,
    ATTACHMENT_TYPE
}
