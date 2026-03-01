const jwt = require('jsonwebtoken')
const User = require('../models/User')

/**
 * JWT 认证中间件
 * 验证请求头中的 token，并将用户信息附加到 req.user
 */
const auth = async (req, res, next) => {
    try {
        // 从请求头获取 token
        const token = req.header('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return res.status(401).json({
                success: false,
                error: '未提供认证令牌'
            })
        }

        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // 查找用户
        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                success: false,
                error: '用户不存在'
            })
        }

        // 将用户信息附加到请求对象
        req.user = user
        req.userId = user._id

        next()
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: '无效的认证令牌'
            })
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: '认证令牌已过期'
            })
        }

        res.status(500).json({
            success: false,
            error: '认证失败'
        })
    }
}

module.exports = auth
