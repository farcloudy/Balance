import CryptoJS from 'crypto-js'

/**
 * 使用 SHA-256 加密密码
 * @param {string} password - 明文密码
 * @returns {string} SHA-256 加密后的字符串
 */
export function encryptPassword(password) {
    return CryptoJS.SHA256(password).toString()
}
