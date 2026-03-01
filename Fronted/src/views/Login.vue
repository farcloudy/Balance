<template>
    <div class="login-container">
        <div class="login-box">
            <h1>Balance 记账系统</h1>
            <form @submit.prevent="handleLogin">
                <div class="form-group">
                    <label>用户名</label>
                    <input v-model="form.username" type="text" required />
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input v-model="form.password" type="password" required />
                </div>
                <button type="submit" :disabled="loading">
                    {{ loading ? '登录中...' : '登录' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { login } from '../api/auth'
import { encryptPassword } from '../utils/crypto'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
    username: '',
    password: ''
})

const loading = ref(false)

async function handleLogin() {
    loading.value = true
    try {
        // 使用 SHA-256 加密密码后再发送到后端
        const encryptedData = {
            username: form.value.username,
            password: encryptPassword(form.value.password)
        }
        const res = await login(encryptedData)
        userStore.setToken(res.token)
        userStore.setUserInfo(res.user)
        router.push('/')
    } catch (error) {
        alert('登录失败：' + (error.response?.data?.error || error.message))
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f5f5f5;
}

.login-box {
    background: white;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
}

h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
}

.form-group {
    margin-bottom: 20px;
}

label {
    display: block;
    margin-bottom: 8px;
    color: #666;
}

input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
}

button {
    width: 100%;
    padding: 12px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

button:hover:not(:disabled) {
    background: #66b1ff;
}

button:disabled {
    background: #a0cfff;
    cursor: not-allowed;
}
</style>
