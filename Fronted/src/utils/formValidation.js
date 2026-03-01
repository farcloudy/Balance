// 表单验证工具函数

/**
 * 验证用户名
 * @param {string} username - 用户名
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateUsername(username) {
    if (!username) {
        return { valid: false, message: '用户名不能为空' }
    }

    if (username.length < 3) {
        return { valid: false, message: '用户名至少需要 3 个字符' }
    }

    if (username.length > 20) {
        return { valid: false, message: '用户名不能超过 20 个字符' }
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
        return { valid: false, message: '用户名只能包含字母、数字和下划线' }
    }

    return { valid: true, message: '' }
}

/**
 * 验证密码
 * @param {string} password - 密码
 * @returns {Object} { valid: boolean, message: string, strength: string }
 */
export function validatePassword(password) {
    if (!password) {
        return { valid: false, message: '密码不能为空', strength: 'none' }
    }

    if (password.length < 8) {
        return { valid: false, message: '密码至少需要 8 个字符', strength: 'weak' }
    }

    // 计算密码强度（基于字符类型多样性）
    let strengthScore = 0
    if (/[a-z]/.test(password)) strengthScore++  // 包含小写字母
    if (/[A-Z]/.test(password)) strengthScore++  // 包含大写字母
    if (/[0-9]/.test(password)) strengthScore++  // 包含数字
    if (/[^a-zA-Z0-9]/.test(password)) strengthScore++  // 包含特殊字符

    // 根据评分确定强度等级
    let strength = 'weak'
    if (strengthScore >= 4) {
        strength = 'strong'  // 包含所有类型
    } else if (strengthScore >= 3) {
        strength = 'medium'  // 包含 3 种类型
    }

    return {
        valid: true,
        message: '',
        strength,
        strengthScore
    }
}

/**
 * 验证密码确认
 * @param {string} password - 原密码
 * @param {string} confirmPassword - 确认密码
 * @returns {Object} { valid: boolean, message: string }
 */
export function validatePasswordConfirm(password, confirmPassword) {
    if (!confirmPassword) {
        return { valid: false, message: '请确认密码' }
    }

    if (password !== confirmPassword) {
        return { valid: false, message: '两次输入的密码不一致' }
    }

    return { valid: true, message: '' }
}

/**
 * 获取密码强度提示文本
 * @param {string} strength - 密码强度等级
 * @returns {string} 提示文本
 */
export function getPasswordStrengthText(strength) {
    const strengthMap = {
        none: '',
        weak: '弱',
        medium: '中等',
        strong: '强'
    }
    return strengthMap[strength] || ''
}

/**
 * 获取密码强度颜色
 * @param {string} strength - 密码强度等级
 * @returns {string} 颜色值
 */
export function getPasswordStrengthColor(strength) {
    const colorMap = {
        none: '#ccc',
        weak: '#f56c6c',
        medium: '#e6a23c',
        strong: '#67c23a'
    }
    return colorMap[strength] || '#ccc'
}
