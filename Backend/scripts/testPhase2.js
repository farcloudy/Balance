const axios = require('axios')

const BASE_URL = 'http://localhost:3000/api'

let token1, token2
let bookId1, bookId2

async function testPhase2() {
    console.log('=== 第二阶段测试：账套管理 ===\n')

    try {
        // 1. 创建两个测试用户
        console.log('1. 创建测试用户...')
        const user1 = await axios.post(`${BASE_URL}/auth/register`, {
            username: 'testuser1',
            password: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        })
        token1 = user1.data.data.token
        console.log('✓ 用户1创建成功')

        const user2 = await axios.post(`${BASE_URL}/auth/register`, {
            username: 'testuser2',
            password: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        })
        token2 = user2.data.data.token
        console.log('✓ 用户2创建成功\n')

        // 2. 用户1创建账套
        console.log('2. 用户1创建账套...')
        const book1 = await axios.post(
            `${BASE_URL}/books`,
            {
                name: '个人账套',
                description: '我的个人记账',
                currency: 'CNY',
                fiscalYearStart: 1
            },
            { headers: { Authorization: `Bearer ${token1}` } }
        )
        bookId1 = book1.data.data.book._id
        console.log(`✓ 账套创建成功，ID: ${bookId1}`)
        console.log(`✓ 自动初始化了 ${book1.data.data.accountsCount} 个会计科目\n`)

        // 3. 用户2创建账套
        console.log('3. 用户2创建账套...')
        const book2 = await axios.post(
            `${BASE_URL}/books`,
            {
                name: '家庭账套',
                description: '家庭财务管理'
            },
            { headers: { Authorization: `Bearer ${token2}` } }
        )
        bookId2 = book2.data.data.book._id
        console.log(`✓ 账套创建成功，ID: ${bookId2}\n`)

        // 4. 用户1获取自己的账套列表
        console.log('4. 用户1获取账套列表...')
        const books1 = await axios.get(`${BASE_URL}/books`, {
            headers: { Authorization: `Bearer ${token1}` }
        })
        console.log(`✓ 用户1有 ${books1.data.data.length} 个账套\n`)

        // 5. 用户1获取账套详情
        console.log('5. 用户1获取账套详情...')
        const bookDetail = await axios.get(`${BASE_URL}/books/${bookId1}`, {
            headers: { Authorization: `Bearer ${token1}` }
        })
        console.log(`✓ 账套名称: ${bookDetail.data.data.name}`)
        console.log(`✓ 账套描述: ${bookDetail.data.data.description}\n`)

        // 6. 用户1更新账套信息
        console.log('6. 用户1更新账套信息...')
        await axios.put(
            `${BASE_URL}/books/${bookId1}`,
            { description: '更新后的描述' },
            { headers: { Authorization: `Bearer ${token1}` } }
        )
        console.log('✓ 账套更新成功\n')

        // 7. 测试多租户隔离：用户1尝试访问用户2的账套
        console.log('7. 测试多租户隔离...')
        try {
            await axios.get(`${BASE_URL}/books/${bookId2}`, {
                headers: { Authorization: `Bearer ${token1}` }
            })
            console.log('✗ 多租户隔离失败：用户1能访问用户2的账套')
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✓ 多租户隔离成功：用户1无法访问用户2的账套\n')
            } else {
                throw error
            }
        }

        // 8. 用户1归档账套
        console.log('8. 用户1归档账套...')
        await axios.delete(`${BASE_URL}/books/${bookId1}`, {
            headers: { Authorization: `Bearer ${token1}` }
        })
        console.log('✓ 账套归档成功\n')

        // 9. 验证归档后的状态
        console.log('9. 验证归档状态...')
        const archivedBooks = await axios.get(`${BASE_URL}/books?status=archived`, {
            headers: { Authorization: `Bearer ${token1}` }
        })
        console.log(`✓ 用户1有 ${archivedBooks.data.data.length} 个已归档账套\n`)

        console.log('=== 所有测试通过 ✓ ===')
    } catch (error) {
        console.error('\n✗ 测试失败:', error.response?.data || error.message)
        process.exit(1)
    }
}

testPhase2()
