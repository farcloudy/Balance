const mongoose = require('mongoose')
const { BOOK_STATUS, DEFAULT_CURRENCY, DEFAULT_FISCAL_YEAR_START } = require('../constants')

const bookSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 50
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    currency: {
        type: String,
        default: DEFAULT_CURRENCY,
        trim: true
    },
    fiscalYearStart: {
        type: Number,
        min: 1,
        max: 12,
        default: DEFAULT_FISCAL_YEAR_START
    },
    status: {
        type: String,
        enum: Object.values(BOOK_STATUS),
        default: BOOK_STATUS.ACTIVE,
        index: true
    }
}, {
    timestamps: true
})

bookSchema.index({ userId: 1, status: 1 })

module.exports = mongoose.model('Book', bookSchema)
