const mongoose = require('mongoose')
const { ACCOUNT_TYPE } = require('../constants')

const accountSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(ACCOUNT_TYPE),
        index: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        default: null,
        index: true
    },
    level: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

accountSchema.index({ bookId: 1, code: 1 }, { unique: true })
accountSchema.index({ bookId: 1, type: 1 })
accountSchema.index({ bookId: 1, parentId: 1 })

module.exports = mongoose.model('Account', accountSchema)
