const crypto = require('crypto')

/**
 * SHA-256 加密函数（模拟前端加密）
 * 用于测试脚本中模拟前端密码加密行为
 *
 * @param {string} password - 明文密码
 * @returns {string} SHA-256 哈希值
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

module.exports = {
    hashPassword
}
