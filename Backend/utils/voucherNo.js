const Entry = require('../models/Entry')
const mongoose = require('mongoose')

/**
 * 生成凭证号
 * 格式：JNL-YYYY-NNN
 * 例如：JNL-2026-001, JNL-2026-002
 *
 * 使用聚合管道在数据库层面查找最大序号，避免内存问题和提高性能
 *
 * @param {ObjectId} bookId - 账套 ID
 * @returns {Promise<string>} 凭证号
 */
async function generateVoucherNo(bookId) {
    const year = new Date().getFullYear()
    const prefix = `JNL-${year}-`

    // 使用聚合管道直接在数据库中找到最大序号
    const result = await Entry.aggregate([
        {
            $match: {
                bookId: new mongoose.Types.ObjectId(bookId),
                voucherNo: { $regex: `^${prefix}` }
            }
        },
        {
            $project: {
                sequenceNumber: {
                    $toInt: { $arrayElemAt: [{ $split: ['$voucherNo', '-'] }, 2] }
                }
            }
        },
        {
            $group: {
                _id: null,
                maxNumber: { $max: '$sequenceNumber' }
            }
        }
    ])

    const nextNumber = result.length > 0 ? result[0].maxNumber + 1 : 1

    // 格式化为三位数字（001, 002, ...）
    const formattedNumber = nextNumber.toString().padStart(3, '0')

    return `${prefix}${formattedNumber}`
}

module.exports = { generateVoucherNo }
