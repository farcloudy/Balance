<template>
    <div class="home-container">
        <header>
            <h1>Balance 记账系统</h1>
            <div class="user-info">
                <span>欢迎，{{ userStore.userInfo?.username }}</span>
                <button @click="handleLogout">退出</button>
            </div>
        </header>
        <main>
            <p>首页内容待开发</p>
        </main>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

function handleLogout() {
    userStore.logout()
    router.push('/login')
}
</script>

<style scoped>
.home-container {
    min-height: 100vh;
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
    margin: 0;
    color: #333;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 20px;
}

button {
    padding: 8px 16px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background: #66b1ff;
}

main {
    padding: 40px;
}
</style>
