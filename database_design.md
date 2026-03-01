# Balance 记账系统 - 数据库结构规划

## Context（背景）

Balance 是一个基于复式记账法和权责发生制的个人记账系统，支持多租户（每个用户可创建多个账套）。当前后端已完成基础框架搭建，但缺少用户认证和数据模型实现。用户无法登录是因为系统尚未实现用户认证功能和数据库模型。

本规划文档定义完整的数据库结构，包括用户模型、账套管理、复式记账、OCR 集成等核心功能的数据模型设计。

---

## 核心设计原则

### 1. 复式记账法（Double-Entry Bookkeeping）
- 每笔交易必须同时记录借方和贷方
- 借方金额 = 贷方金额（保持平衡）
- 支持完整的审计追踪

### 2. 权责发生制会计
- 按交易发生日期记账，而非支付日期
- 支持应收/应付科目
- 支持月度、季度、半年度、年度报表生成

### 3. 多租户隔离
- 用户之间数据完全隔离
- 同一用户的多个账套独立管理
- 所有查询必须包含 userId 和 bookId 过滤

### 4. 数值精度
- 所有金额以整数存储（乘以 100）
- 防止浮点数精度错误
- 前端显示时除以 100 并保留 2 位小数

---

## 数据库集合设计

### 1. users（用户表）

**用途**: 存储系统用户的基本信息和认证凭据

```javascript
{
    _id: ObjectId,
    username: String,           // 用户名（唯一）
    password: String,           // 密码（bcrypt 加密）
    type: String,               // 用户类型：管理员 / 用户
    createdAt: Date,
    updatedAt: Date
}
```

**索引**:
```javascript
db.users.createIndex({ username: 1 }, { unique: true })
```

**验证规则**:
- username: 必填，3-20 字符，唯一
- password: 必填，加密后存储
- type: 默认 '用户'

---

### 2. books（账套表）

**用途**: 管理用户的多个独立账套

```javascript
{
    _id: ObjectId,
    userId: ObjectId,        // 关联 users._id
    name: String,            // 账套名称
    description: String,     // 账套描述
    currency: String,        // 货币代码（默认 CNY）
    fiscalYearStart: Number, // 会计年度开始月份（1-12）
    status: String,          // 状态：active/archived
    createdAt: Date,
    updatedAt: Date
}
```

**索引**:
```javascript
db.books.createIndex({ userId: 1 })
db.books.createIndex({ userId: 1, status: 1 })
```

**验证规则**:
- name: 必填，1-50 字符
- currency: 默认 'CNY'
- fiscalYearStart: 默认 1（1月）
- status: 默认 'active'

---

### 3. accounts（会计科目表）

**用途**: 定义会计科目的层级结构和余额

```javascript
{
    _id: ObjectId,
    bookId: ObjectId,        // 关联 books._id
    code: String,            // 科目代码（如 1001）
    name: String,            // 科目名称（如"现金"）
    description: String,    // 会计政策，用户在这里介绍，这个科目用于登记什么样的交易
    type: String,            // 科目类型：asset/liability/equity/income/expense
    category: String,        // 科目分类（如"流动资产"）
    parentId: ObjectId,      // 父科目 ID（null 表示顶级科目）
    level: Number,           // 科目级别（1-5）
    isActive: Boolean,       // 是否启用
    createdAt: Date,
    updatedAt: Date
    }
```

**索引**:
```javascript
db.accounts.createIndex({ bookId: 1, code: 1 }, { unique: true })
db.accounts.createIndex({ bookId: 1, type: 1 })
db.accounts.createIndex({ bookId: 1, parentId: 1 })
```

**科目类型枚举**:
- `asset`: 资产
- `liability`: 负债
- `equity`: 权益
- `income`: 收入
- `expense`: 支出

**标准科目代码规则**:
- 1xxx: 资产类
- 2xxx: 负债类
- 3xxx: 权益类
- 4xxx: 收入类
- 5xxx: 支出类

---

### 4. entries（分录行表）

**用途**: 统一的分录行表，每一行代表一条会计分录记录。支持复式记账、现金流量分析和 AI 辅助录入。

```javascript
{
    _id: ObjectId,
    bookId: ObjectId,           // 关联 books._id

    // === 凭证信息 ===
    voucherNo: String,          // 凭证号（如 JNL-2026-001），同一凭证的多行共享相同凭证号
    date: Date,                 // 交易发生日期（权责发生制）
    description: String,        // 交易摘要/分录说明
    status: String,             // 状态：draft/posted/reversed。如果是AI生成，就标记为draft，等待用户确认

    // === 分录信息 ===
    accountId: ObjectId,        // 关联 accounts._id（会计科目）
    debit: Number,              // 借方金额（整数，单位：分，0 表示无）
    credit: Number,             // 贷方金额（整数，单位：分，0 表示无）

    // === 业务信息 ===
    type: String,               // 交易类型：income/expense/transfer/other
    counterparty: String,       // 交易对方
    tags: [String],             // 标签

    // === 现金流量信息 ===
    cashFlowAccount: ObjectId,     // 现金流量类型：关联现金流量表的accounts._id，默认为空

    // === 附件信息 ===
    attachments: [              // 附件列表（同一凭证的多行可共享附件）
        {
            type: String,           // 类型：image/document
            url: String,            // 对象存储 URL
            filename: String,       // 原始文件名
            uploadedAt: Date        // 上传时间
        }
    ],

    // === 审计信息 ===
    createdBy: ObjectId,        // 创建人（关联 users._id）
    createdAt: Date,
    updatedAt: Date
}
```

**索引**:
```javascript
db.entries.createIndex({ bookId: 1, voucherNo: 1 })
db.entries.createIndex({ bookId: 1, date: 1 })
db.entries.createIndex({ bookId: 1, accountId: 1 })
db.entries.createIndex({ bookId: 1, status: 1 })
```

**状态枚举**:
- `draft`: 草稿（未过账）
- `posted`: 已过账
- `reversed`: 已冲销

**交易类型枚举**:
- `income`: 收入
- `expense`: 支出
- `transfer`: 转账
- `other`: 其他

**验证规则**:
- debit 和 credit 不能同时为 0
- 同一 voucherNo 下所有 entries 的 debit 总和必须等于 credit 总和

**设计说明**:
1. **灵活的分录结构**: 每一行都是独立的分录记录，一笔凭证可以有多个借方和多个贷方，不要求一一对应
2. **现金流量支持**: 通过 cashFlowAccount 字段，可以直接从分录行生成现金流量表
3. **AI 辅助录入**: AI 提取的信息直接存储在分录行上，用户可以逐行决定是否采用或修改
4. **凭证分组**: 通过 voucherNo 将多行分录关联为一笔完整的凭证

---

### 5. reports（报表表）

**用途**: 缓存生成的财务报表

```javascript
{
    _id: ObjectId,
    bookId: ObjectId,        // 关联 books._id
    type: String,            // 报表类型：balance_sheet/income_statement/cash_flow
    period: String,          // 报表期间（YYYY-MM 或 YYYY-Q1 等）
    data: Object,            // 报表数据（JSON 格式）
    generatedAt: Date        // 生成时间
}
```

**索引**:
```javascript
db.reports.createIndex({ bookId: 1, type: 1, period: 1 }, { unique: true })
```

**报表类型枚举**:
- `balance_sheet`: 资产负债表
- `income_statement`: 利润表
- `cash_flow`: 现金流量表

---

## 数据流关系图

```
用户登录 (users)
    ↓
选择/创建账套 (books)
    ↓
上传图片（可选）
    ↓
AI 提取信息并创建草稿分录 (entries with status=draft)
    ↓
用户审核/修改分录
    ↓
确认并过账 (entries.status = posted)
    ↓
验证凭证平衡性（同一 voucherNo 的借 = 贷）
    ↓
更新科目余额 (accounts.debitBalance/creditBalance)
    ↓
生成报表 (reports)
```

---

## 多租户隔离策略

### 查询模式
所有数据查询必须遵循以下模式：

```javascript
// 1. 验证 bookId 属于当前用户
const book = await Book.findOne({ _id: bookId, userId: currentUserId })
if (!book) throw new Error('无权访问此账套')

// 2. 执行业务查询
const journals = await Journal.find({ bookId })
```

### 中间件保护
创建认证中间件自动验证：
1. JWT token 有效性
2. 提取 userId
3. 验证 bookId 所有权（如果请求包含 bookId）

---

## 初始数据

### 默认管理员账号
```javascript
{
    username: 'admin',
    password: 'admin123',  // 实际存储时会加密
    createdAt: new Date()
}
```

### 标准会计科目模板
创建账套时自动初始化以下科目：

```
资产类 (1)
├── 流动资产 (11)
│   ├── 货币资金 (111)
│   │   ├── 银行存款(1111)
│   │   ├── 支付宝(1112)
│   │   ├── 微信(1113)
│   │   └── 数字人民币(1114)
│   ├── 应收款 (112)
│   ├── 短期投资 (113)
│   └── 存货 (114)
└── 固定资产 (12)
    ├── 长期储蓄账户 (121)
    ├── 长期投资 (122)
    ├── 出租不动产 (123)

负债类 (2)
├── 流动负债 (21)
│   ├── 应付款 (211)
│   ├── 信用卡 (212)
│   └── 短期借款 (213)
└── 长期负债 (22)
    ├── 长期贷款 (221)
    ├── 自用房产 (222)
    └── 车辆 (223)

权益类 (3)
├── 期初资本 (31)
└── 未分配利润 (32)

收入类 (4)
├── 工资收入 (41)
├── 投资收益 (42)
└── 其他收入 (43)

支出类 (5)
├── 餐饮支出 (51)
├── 交通支出 (52)
├── 购物支出 (53)
├── 住房支出 (54)
└── 其他支出 (55)
```

---

## 关键业务逻辑

### 1. 创建交易的完整流程

**场景示例**: 收到工资 10000 元，其中 8000 元转入银行，2000 元留在支付宝

```javascript
const voucherNo = await generateVoucherNo(bookId) // JNL-2026-002

const entries = await Entry.create([
    // 借方 1: 银行存款增加 8000 元
    {
        bookId,
        voucherNo,
        date: new Date('2026-03-01'),
        description: '工资收入',
        status: 'draft',
        accountId: bankAccountId,         // 1111 银行存款
        debit: 800000,                    // 8000.00 元
        credit: 0,
        type: 'income',
        counterparty: '某公司',
        cashFlowAccount: incomeAccountId, // 现金流入，关联收入科目
        createdBy: userId
    },
    // 借方 2: 支付宝增加 2000 元
    {
        bookId,
        voucherNo,
        date: new Date('2026-03-01'),
        description: '工资收入',
        status: 'draft',
        accountId: alipayAccountId,       // 1112 支付宝
        debit: 200000,                    // 2000.00 元
        credit: 0,
        type: 'income',
        counterparty: '某公司',
        cashFlowAccount: incomeAccountId, // 现金流入，关联收入科目
        createdBy: userId
    },
    // 贷方: 工资收入 10000 元
    {
        bookId,
        voucherNo,
        date: new Date('2026-03-01'),
        description: '工资收入',
        status: 'draft',
        accountId: incomeAccountId,       // 4101 工资收入
        debit: 0,
        credit: 1000000,                  // 10000.00 元
        type: 'income',
        counterparty: '某公司',
        cashFlowAccount: null,            // 收入类科目不涉及现金流
        createdBy: userId
    }
])

// 步骤 3: 验证凭证平衡性
// 验证: 800000 + 200000 = 1000000 ✓
const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)
if (totalDebit !== totalCredit) {
    throw new Error('凭证不平衡：借方合计 ≠ 贷方合计')
}

// 步骤 4: 用户确认后过账
await Entry.updateMany(
    { voucherNo },
    { status: 'posted' }
)

// 注意: 科目余额不在数据库中存储，而是通过查询 entries 表动态计算

```

---

### 2. OCR/视觉模型工作流

#### 2.1 完整的 AI 辅助录入流程

```javascript
// 步骤 1: 上传图片到对象存储
const file = req.files.image
const imageUrl = await uploadToStorage(file)

// 步骤 2: 调用 AI API 提取信息
const aiResult = await callVisionAPI(imageUrl, {
    prompt: `
        分析这张支付截图，提取以下信息：
        1. 支付金额
        2. 支付时间
        3. 收款方/商户名称
        4. 支付方式（微信/支付宝/银行卡等）
        5. 交易类型（餐饮/交通/购物/住房等）
        6. 建议的会计科目（借方和贷方）

        返回 JSON 格式。
    `
})

// AI 返回示例:
// {
//     amount: 50.00,
//     date: '2026-03-01 12:30',
//     merchant: '某餐厅',
//     paymentMethod: '微信支付',
//     category: '餐饮',
//     suggestedAccounts: {
//         debit: { code: '5101', name: '餐饮支出' },
//         credit: { code: '1113', name: '微信' }
//     }
// }

// 步骤 3: 生成凭证号
const voucherNo = await generateVoucherNo(bookId)

// 步骤 4: 创建草稿分录（AI 生成）
const entries = await Entry.create([
    {
        bookId,
        voucherNo,
        date: new Date(aiResult.date),
        description: `${aiResult.category} - ${aiResult.merchant}`,
        status: 'draft',                  // 关键：标记为草稿
        accountId: debitAccountId,        // 根据 AI 建议查找科目 ID
        debit: Math.round(aiResult.amount * 100),
        credit: 0,
        type: 'expense',
        counterparty: aiResult.merchant,
        tags: [aiResult.category],
        attachments: [{
            type: 'image',
            url: imageUrl,
            filename: file.originalname,
            uploadedAt: new Date()
        }],
        createdBy: userId
    },
    {
        bookId,
        voucherNo,
        date: new Date(aiResult.date),
        description: `${aiResult.category} - ${aiResult.merchant}`,
        status: 'draft',
        accountId: creditAccountId,
        debit: 0,
        credit: Math.round(aiResult.amount * 100),
        type: 'expense',
        counterparty: aiResult.merchant,
        tags: [aiResult.category],
        attachments: [{
            type: 'image',
            url: imageUrl,
            filename: file.originalname,
            uploadedAt: new Date()
        }],
        createdBy: userId
    }
])

// 步骤 5: 返回草稿分录给前端
res.json({
    success: true,
    voucherNo,
    entries: entries.map(e => ({
        ...e.toObject(),
        amount: e.debit || e.credit,      // 前端显示用
        amountDisplay: ((e.debit || e.credit) / 100).toFixed(2)
    })),
    aiSuggestion: aiResult
})

// 步骤 6: 用户在前端审核并修改（如果需要）
// 前端发送确认请求后，后端执行过账

// 步骤 7: 用户确认后过账
await Entry.updateMany(
    { voucherNo },
    { status: 'posted', updatedAt: new Date() }
)
```

#### 2.2 AI 识别错误的处理

```javascript
// 如果用户发现 AI 识别错误，可以修改草稿分录
await Entry.findByIdAndUpdate(entryId, {
    accountId: correctedAccountId,
    debit: correctedDebit,
    credit: correctedCredit,
    description: correctedDescription,
    updatedAt: new Date()
})

// 或者直接清空草稿，只保留id和附件：
// 
```

---

### 3. 查询科目余额（核心方法）

```javascript
async function getAccountBalance(bookId, accountId, asOfDate = new Date()) {
    // 查询截至指定日期的所有有效分录
    const entries = await Entry.find({
        bookId,
        accountId,
        date: { $lte: asOfDate },
        status: { $in: ['posted', 'reversed'] }
    })

    // 汇总借贷金额
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)

    // 计算余额（借方余额为正，贷方余额为负）
    const balance = totalDebit - totalCredit

    return {
        accountId,
        asOfDate,
        totalDebit,
        totalCredit,
        balance,
        balanceDisplay: (balance / 100).toFixed(2)
    }
}
```

---

### 4. 生成财务报表（基于科目余额派生）

所有报表都基于 `getAccountBalance` 方法派生，逻辑简洁统一。

#### 4.1 资产负债表（时点报表）

```javascript
async function generateBalanceSheet(bookId, asOfDate) {
    // 查询所有科目
    const accounts = await Account.find({ bookId, isActive: true })

    // 计算每个科目的余额
    const balances = await Promise.all(
        accounts.map(async (account) => {
            const { balance } = await getAccountBalance(bookId, account._id, asOfDate)
            return {
                code: account.code,
                name: account.name,
                type: account.type,
                balance
            }
        })
    )

    // 按科目类型分组
    const assets = balances.filter(b => b.type === 'asset' && b.balance > 0)
    const liabilities = balances.filter(b => b.type === 'liability' && b.balance < 0)
    const equity = balances.filter(b => b.type === 'equity')

    // 计算总计
    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0)
    const totalLiabilities = liabilities.reduce((sum, l) => sum + Math.abs(l.balance), 0)
    const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0)

    return {
        asOfDate,
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
        isBalanced: totalAssets === (totalLiabilities + totalEquity)
    }
}
```

#### 4.2 利润表（期间报表）

```javascript
async function generateIncomeStatement(bookId, startDate, endDate) {
    // 查询收入和支出类科目
    const accounts = await Account.find({
        bookId,
        isActive: true,
        type: { $in: ['income', 'expense'] }
    })

    // 计算期间发生额（期末余额 - 期初余额）
    const balances = await Promise.all(
        accounts.map(async (account) => {
            const startBalance = await getAccountBalance(bookId, account._id, new Date(startDate.getTime() - 1))
            const endBalance = await getAccountBalance(bookId, account._id, endDate)

            return {
                code: account.code,
                name: account.name,
                type: account.type,
                amount: Math.abs(endBalance.balance - startBalance.balance)
            }
        })
    )

    // 按类型分组
    const income = balances.filter(b => b.type === 'income')
    const expense = balances.filter(b => b.type === 'expense')

    // 计算总计
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0)
    const totalExpense = expense.reduce((sum, e) => sum + e.amount, 0)

    return {
        period: { startDate, endDate },
        income,
        expense,
        totalIncome,
        totalExpense,
        netIncome: totalIncome - totalExpense
    }
}
```

#### 4.3 现金流量表（期间报表）

```javascript
async function generateCashFlowStatement(bookId, startDate, endDate) {
    // 查询货币资金类科目
    const cashAccounts = await Account.find({
        bookId,
        isActive: true,
        category: '货币资金'
    })

    // 计算期间发生额（期末余额 - 期初余额）
    const balances = await Promise.all(
        cashAccounts.map(async (account) => {
            const startBalance = await getAccountBalance(bookId, account._id, new Date(startDate.getTime() - 1))
            const endBalance = await getAccountBalance(bookId, account._id, endDate)

            return {
                code: account.code,
                name: account.name,
                netFlow: endBalance.balance - startBalance.balance
            }
        })
    )

    return {
        period: { startDate, endDate },
        cashFlows: balances,
        netCashFlow: balances.reduce((sum, b) => sum + b.netFlow, 0)
    }
}
```

---

### 5. 凭证冲销

```javascript
async function reverseVoucher(voucherNo, reversalDate, userId) {
    // 查询原凭证的所有分录
    const originalEntries = await Entry.find({ voucherNo, status: 'posted' })

    if (originalEntries.length === 0) {
        throw new Error('凭证不存在或未过账')
    }

    // 生成新的冲销凭证号
    const reversalVoucherNo = await generateVoucherNo(originalEntries[0].bookId)

    // 创建冲销分录（借贷方向相反）
    const reversalEntries = originalEntries.map(entry => ({
        bookId: entry.bookId,
        voucherNo: reversalVoucherNo,
        date: reversalDate,
        description: `冲销：${entry.description}`,
        status: 'posted',
        accountId: entry.accountId,
        debit: entry.credit,              // 借贷互换
        credit: entry.debit,
        type: entry.type,
        counterparty: entry.counterparty,
        tags: [...entry.tags, '冲销'],
        cashFlowAccount: entry.cashFlowAccount,
        createdBy: userId
    }))

    await Entry.create(reversalEntries)

    // 标记原凭证为已冲销
    await Entry.updateMany(
        { voucherNo },
        { status: 'reversed' }
    )

    return reversalVoucherNo
}
```

---

## 实现文件结构

```
Backend/
├── models/
│   ├── User.js           # 用户模型
│   ├── Book.js           # 账套模型
│   ├── Account.js        # 会计科目模型
│   ├── Entry.js          # 分录行模型（统一的核心数据模型）
│   └── Report.js         # 报表模型
├── routes/
│   ├── auth.js           # 认证路由
│   ├── books.js          # 账套管理路由
│   ├── accounts.js       # 会计科目路由
│   ├── entries.js        # 分录路由（包含凭证和交易的所有操作）
│   ├── reports.js        # 报表路由
│   └── ai.js             # AI 接口路由
├── middleware/
│   ├── auth.js           # JWT 认证中间件
│   └── bookAccess.js     # 账套权限验证中间件
├── utils/
│   ├── voucherNo.js      # 凭证号生成
│   └── validation.js     # 数据验证
└── scripts/
    └── initAdmin.js      # 初始化管理员账号
```

---

## 验证方案

### 1. 数据完整性验证
- 每个凭证（相同 voucherNo）的分录借贷平衡
- 科目余额与分录汇总一致
- 多租户隔离（无法访问其他用户数据）
- 现金流量标记的一致性（isCashFlow=true 时必须有 cashFlowAccount 和 cashFlowType）

### 2. 功能测试
- 用户注册/登录
- 创建账套
- 创建分录（验证借贷平衡）
- AI 辅助录入（草稿 -> 审核 -> 过账）
- 查询凭证和交易历史
- 生成报表（资产负债表、利润表、现金流量表）

### 3. 性能测试
- 索引有效性（查询响应时间 < 100ms）
- 大量数据下的报表生成性能
- 按 voucherNo 分组查询的性能

---

## 注意事项

1. **金额处理**: 所有金额必须以整数（分）存储，前端显示时除以 100
2. **时区处理**: 所有日期使用 UTC 时间存储，前端显示时转换为本地时区
3. **事务处理**: 创建同一凭证的多条分录应在数据库事务中完成，确保借贷平衡
4. **软删除**: 重要数据（entries）使用软删除（添加 deletedAt 字段）
5. **审计日志**: 记录所有修改操作的用户和时间
6. **凭证完整性**: 通过 voucherNo 关联的多条分录构成一笔完整凭证，删除或修改时需要整体处理
7. **AI 辅助流程**: AI 生成的分录默认为草稿状态，用户审核后再过账，避免错误数据影响账套
8. **现金流量标记**: 只有涉及现金类科目的分录才标记 isCashFlow=true，便于生成现金流量表
