const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()

/**
 * 生成 JWT token
 * @param {string} userId - 用户 ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
}

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body

        // 基础验证：仅检查必填字段
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: '用户名和密码不能为空'
            })
        }

        // 注释掉前端应该做的验证逻辑
        // 前端负责：用户名长度、格式验证、密码强度验证
        // if (username.length < 3 || username.length > 20) {
        //     return res.status(400).json({
        //         success: false,
        //         error: '用户名长度必须在 3-20 个字符之间'
        //     })
        // }

        // if (password.length < 6) {
        //     return res.status(400).json({
        //         success: false,
        //         error: '密码长度至少为 6 个字符'
        //     })
        // }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: '用户名已存在'
            })
        }

        // 密码加密流程：
        // 1. 前端：用户输入明文密码 → 使用 crypto-js 加密（如 SHA-256）→ 传输到后端
        // 2. 后端：接收前端加密后的字符串 → 使用 bcrypt 进行二次哈希 → 存储到数据库
        // 这样做的好处：即使传输过程被截获，攻击者也无法直接获取明文密码
        const hashedPassword = await bcrypt.hash(password, 10)

        // 创建用户
        const user = new User({
            username,
            password: hashedPassword
        })

        await user.save()

        // 生成 token
        const token = generateToken(user._id)

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    type: user.type
                }
            }
        })
    } catch (error) {
        console.error('注册错误:', error)
        res.status(500).json({
            success: false,
            error: '注册失败，请稍后重试'
        })
    }
})

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        // 基础验证：仅检查必填字段
        // 前端负责：用户名、密码格式验证、空值验证

        // 查找用户
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误'
            })
        }

        // 验证密码
        // 注意：password 是前端加密后的字符串，这里验证的是二次哈希
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误'
            })
        }

        // 生成 token
        const token = generateToken(user._id)

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    type: user.type
                }
            }
        })
    } catch (error) {
        console.error('登录错误:', error)
        res.status(500).json({
            success: false,
            error: '登录失败，请稍后重试'
        })
    }
})

/**
 * GET /api/auth/me
 * 获取当前用户信息（需要认证）
 */
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    username: req.user.username,
                    type: req.user.type,
                }
            }
        })
    } catch (error) {
        console.error('获取用户信息错误:', error)
        res.status(500).json({
            success: false,
            error: '获取用户信息失败'
        })
    }
})

/**
 * POST /api/auth/logout
 * 用户登出（可选，前端删除 token 即可）
 */
router.post('/logout', auth, async (req, res) => {
    try {
        // JWT 是无状态的，实际的登出由前端删除 token 完成
        // 这个接口主要用于记录日志或执行其他清理操作
        // TODO: 后续可在此处添加登出日志记录
        res.json({
            success: true,
            message: '登出成功'
        })
    } catch (error) {
        console.error('登出错误:', error)
        res.status(500).json({
            success: false,
            error: '登出失败'
        })
    }
})

module.exports = router
