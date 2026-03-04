const mongoose = require('mongoose')
const { ENTRY_STATUS, ENTRY_TYPE, ATTACHMENT_TYPE } = require('../constants/entryConstants')

const entrySchema = new mongoose.Schema({
    // 关联账套
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
        index: true
    },

    // === 凭证信息 ===
    voucherNo: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: Object.values(ENTRY_STATUS),
        default: ENTRY_STATUS.DRAFT,
        index: true
    },

    // === 分录信息 ===
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
        index: true
    },
    debit: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    credit: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },

    // === 业务信息 ===
    type: {
        type: String,
        enum: Object.values(ENTRY_TYPE),
        default: ENTRY_TYPE.OTHER
    },
    counterparty: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],

    // === 现金流量信息 ===
    cashFlowAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },

    // === 附件信息 ===
    attachments: [{
        type: {
            type: String,
            enum: Object.values(ATTACHMENT_TYPE)
        },
        url: String,
        filename: String,
        uploadedAt: Date
    }],

    // === 审计信息 ===
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
})

// 复合索引
entrySchema.index({ bookId: 1, voucherNo: 1 }, { unique: true })
entrySchema.index({ bookId: 1, date: -1, status: 1 })
entrySchema.index({ bookId: 1, accountId: 1 })
entrySchema.index({ bookId: 1, status: 1 })

module.exports = mongoose.model('Entry', entrySchema)
