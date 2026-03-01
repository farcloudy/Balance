<template>
    <div class="register-container">
        <div class="register-card">
            <h2 class="register-title">注册</h2>

            <form @submit.prevent="handleRegister" class="register-form">
                <!-- 用户名输入 -->
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input
                        id="username"
                        v-model="formData.username"
                        type="text"
                        placeholder="3-20个字符，仅限字母、数字和下划线"
                        @blur="validateField('username')"
                        @input="clearFieldError('username')"
                        :class="{ 'input-error': errors.username }"
                    />
                    <span v-if="errors.username" class="error-message">
                        {{ errors.username }}
                    </span>
                </div>

                <!-- 密码输入 -->
                <div class="form-group">
                    <label for="password">密码</label>
                    <div class="password-input-wrapper">
                        <input
                            id="password"
                            v-model="formData.password"
                            :type="showPassword ? 'text' : 'password'"
                            placeholder="至少8个字符，建议包含大小写字母、数字和特殊字符"
                            @blur="validateField('password')"
                            @input="onPasswordInput"
                            :class="{ 'input-error': errors.password }"
                        />
                        <button
                            type="button"
                            class="toggle-password"
                            @click="showPassword = !showPassword"
                        >
                            {{ showPassword ? '隐藏' : '显示' }}
                        </button>
                    </div>
                    <span v-if="errors.password" class="error-message">
                        {{ errors.password }}
                    </span>

                    <!-- 密码强度指示器 -->
                    <div v-if="formData.password" class="password-strength">
                        <div class="strength-bar">
                            <div
                                class="strength-fill"
                                :style="{
                                    width: `${(passwordStrength.strengthScore / 4) * 100}%`,
                                    backgroundColor: getPasswordStrengthColor(passwordStrength.strength)
                                }"
                            ></div>
                        </div>
                        <span
                            class="strength-text"
                            :style="{ color: getPasswordStrengthColor(passwordStrength.strength) }"
                        >
                            密码强度：{{ getPasswordStrengthText(passwordStrength.strength) }}
                        </span>
                    </div>
                </div>

                <!-- 确认密码输入 -->
                <div class="form-group">
                    <label for="confirmPassword">确认密码</label>
                    <div class="password-input-wrapper">
                        <input
                            id="confirmPassword"
                            v-model="formData.confirmPassword"
                            :type="showConfirmPassword ? 'text' : 'password'"
                            placeholder="请再次输入密码"
                            @blur="validateField('confirmPassword')"
                            @input="clearFieldError('confirmPassword')"
                            :class="{ 'input-error': errors.confirmPassword }"
                        />
                        <button
                            type="button"
                            class="toggle-password"
                            @click="showConfirmPassword = !showConfirmPassword"
                        >
                            {{ showConfirmPassword ? '隐藏' : '显示' }}
                        </button>
                    </div>
                    <span v-if="errors.confirmPassword" class="error-message">
                        {{ errors.confirmPassword }}
                    </span>
                </div>

                <!-- 提交按钮 -->
                <button
                    type="submit"
                    class="submit-button"
                    :disabled="isSubmitting"
                >
                    {{ isSubmitting ? '注册中...' : '注册' }}
                </button>

                <!-- 登录链接 -->
                <div class="login-link">
                    已有账号？<router-link to="/login">立即登录</router-link>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { register } from '@/api/auth'
import {
    validateUsername,
    validatePassword,
    validatePasswordConfirm,
    getPasswordStrengthText,
    getPasswordStrengthColor
} from '@/utils/formValidation'
import { encryptPassword } from '@/utils/crypto'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const formData = reactive({
    username: '',
    password: '',
    confirmPassword: ''
})

// 错误信息
const errors = reactive({
    username: '',
    password: '',
    confirmPassword: ''
})

// 密码强度
const passwordStrength = reactive({
    strength: 'none',
    strengthScore: 0
})

// 状态
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)

/**
 * 验证单个字段
 */
function validateField(field) {
    if (field === 'username') {
        const result = validateUsername(formData.username)
        errors.username = result.valid ? '' : result.message
        return result.valid
    }

    if (field === 'password') {
        const result = validatePassword(formData.password)
        errors.password = result.valid ? '' : result.message

        // 更新密码强度
        if (result.valid) {
            passwordStrength.strength = result.strength
            passwordStrength.strengthScore = result.strengthScore
        }

        return result.valid
    }

    if (field === 'confirmPassword') {
        const result = validatePasswordConfirm(formData.password, formData.confirmPassword)
        errors.confirmPassword = result.valid ? '' : result.message
        return result.valid
    }

    return true
}

/**
 * 清除字段错误
 */
function clearFieldError(field) {
    errors[field] = ''
}

/**
 * 密码输入时的处理
 */
function onPasswordInput() {
    clearFieldError('password')

    // 实时更新密码强度
    if (formData.password) {
        const result = validatePassword(formData.password)
        if (result.valid) {
            passwordStrength.strength = result.strength
            passwordStrength.strengthScore = result.strengthScore
        }
    } else {
        passwordStrength.strength = 'none'
        passwordStrength.strengthScore = 0
    }
}

/**
 * 验证整个表单
 */
function validateForm() {
    const usernameValid = validateField('username')
    const passwordValid = validateField('password')
    const confirmPasswordValid = validateField('confirmPassword')

    return usernameValid && passwordValid && confirmPasswordValid
}

/**
 * 处理注册
 */
async function handleRegister() {
    // 验证表单
    if (!validateForm()) {
        return
    }

    try {
        isSubmitting.value = true

        // 加密密码
        const encryptedPassword = encryptPassword(formData.password)

        // 调用注册接口
        await register({
            username: formData.username,
            password: encryptedPassword
        })

        // 注册成功提示
        alert('注册成功，请登录')

        // 跳转到登录页
        router.push('/login')
    } catch (error) {
        // 显示错误信息
        if (error.response?.data?.error) {
            const errorMsg = error.response.data.error
            // 根据错误类型显示在相应字段
            if (errorMsg.includes('用户名')) {
                errors.username = errorMsg
            } else {
                errors.password = errorMsg
            }
        } else {
            errors.password = '注册失败，请稍后重试'
        }
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
}

.register-card {
    width: 100%;
    max-width: 400px;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.register-title {
    margin: 0 0 30px;
    text-align: center;
    font-size: 24px;
    color: #333;
}

.register-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-size: 14px;
    color: #666;
}

.form-group input {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.3s;
}

.form-group input:focus {
    outline: none;
    border-color: #409eff;
}

.form-group input.input-error {
    border-color: #f56c6c;
}

.password-input-wrapper {
    position: relative;
    display: flex;
}

.password-input-wrapper input {
    flex: 1;
    padding-right: 60px;
}

.toggle-password {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    padding: 0;
    border: none;
    background: none;
    color: #409eff;
    font-size: 12px;
    cursor: pointer;
}

.error-message {
    font-size: 12px;
    color: #f56c6c;
}

.password-strength {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.strength-bar {
    height: 4px;
    background-color: #e4e7ed;
    border-radius: 2px;
    overflow: hidden;
}

.strength-fill {
    height: 100%;
    transition: width 0.3s, background-color 0.3s;
}

.strength-text {
    font-size: 12px;
}

.submit-button {
    padding: 12px;
    border: none;
    border-radius: 4px;
    background-color: #409eff;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.submit-button:hover:not(:disabled) {
    background-color: #66b1ff;
}

.submit-button:disabled {
    background-color: #a0cfff;
    cursor: not-allowed;
}

.login-link {
    text-align: center;
    font-size: 14px;
    color: #666;
}

.login-link a {
    color: #409eff;
    text-decoration: none;
}

.login-link a:hover {
    text-decoration: underline;
}
</style>
