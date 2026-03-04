const accountTemplate = [
    // 资产类 (1)
    { code: '1', name: '资产', type: 'asset', category: '资产', level: 1, parentCode: null },
    { code: '11', name: '流动资产', type: 'asset', category: '流动资产', level: 2, parentCode: '1' },
    { code: '111', name: '货币资金', type: 'asset', category: '货币资金', level: 3, parentCode: '11' },
    { code: '1111', name: '银行存款', type: 'asset', category: '货币资金', level: 4, parentCode: '111' },
    { code: '1112', name: '支付宝', type: 'asset', category: '货币资金', level: 4, parentCode: '111' },
    { code: '1113', name: '微信', type: 'asset', category: '货币资金', level: 4, parentCode: '111' },
    { code: '1114', name: '数字人民币', type: 'asset', category: '货币资金', level: 4, parentCode: '111' },
    { code: '112', name: '应收款', type: 'asset', category: '流动资产', level: 3, parentCode: '11' },
    { code: '113', name: '短期投资', type: 'asset', category: '流动资产', level: 3, parentCode: '11' },
    { code: '114', name: '存货', type: 'asset', category: '流动资产', level: 3, parentCode: '11' },
    { code: '12', name: '固定资产', type: 'asset', category: '固定资产', level: 2, parentCode: '1' },
    { code: '121', name: '长期储蓄账户', type: 'asset', category: '固定资产', level: 3, parentCode: '12' },
    { code: '122', name: '长期投资', type: 'asset', category: '固定资产', level: 3, parentCode: '12' },
    { code: '123', name: '出租不动产', type: 'asset', category: '固定资产', level: 3, parentCode: '12' },

    // 负债类 (2)
    { code: '2', name: '负债', type: 'liability', category: '负债', level: 1, parentCode: null },
    { code: '21', name: '流动负债', type: 'liability', category: '流动负债', level: 2, parentCode: '2' },
    { code: '211', name: '应付款', type: 'liability', category: '流动负债', level: 3, parentCode: '21' },
    { code: '212', name: '信用卡', type: 'liability', category: '流动负债', level: 3, parentCode: '21' },
    { code: '213', name: '短期借款', type: 'liability', category: '流动负债', level: 3, parentCode: '21' },
    { code: '22', name: '长期负债', type: 'liability', category: '长期负债', level: 2, parentCode: '2' },
    { code: '221', name: '长期贷款', type: 'liability', category: '长期负债', level: 3, parentCode: '22' },
    { code: '222', name: '自用房产', type: 'liability', category: '长期负债', level: 3, parentCode: '22' },
    { code: '223', name: '车辆', type: 'liability', category: '长期负债', level: 3, parentCode: '22' },

    // 权益类 (3)
    { code: '3', name: '权益', type: 'equity', category: '权益', level: 1, parentCode: null },
    { code: '31', name: '期初资本', type: 'equity', category: '权益', level: 2, parentCode: '3' },
    { code: '32', name: '未分配利润', type: 'equity', category: '权益', level: 2, parentCode: '3' },

    // 收入类 (4)
    { code: '4', name: '收入', type: 'income', category: '收入', level: 1, parentCode: null },
    { code: '41', name: '工资收入', type: 'income', category: '收入', level: 2, parentCode: '4' },
    { code: '42', name: '投资收益', type: 'income', category: '收入', level: 2, parentCode: '4' },
    { code: '43', name: '其他收入', type: 'income', category: '收入', level: 2, parentCode: '4' },

    // 支出类 (5)
    { code: '5', name: '支出', type: 'expense', category: '支出', level: 1, parentCode: null },
    { code: '51', name: '餐饮支出', type: 'expense', category: '支出', level: 2, parentCode: '5' },
    { code: '52', name: '交通支出', type: 'expense', category: '支出', level: 2, parentCode: '5' },
    { code: '53', name: '购物支出', type: 'expense', category: '支出', level: 2, parentCode: '5' },
    { code: '54', name: '住房支出', type: 'expense', category: '支出', level: 2, parentCode: '5' },
    { code: '55', name: '其他支出', type: 'expense', category: '支出', level: 2, parentCode: '5' }
]

module.exports = accountTemplate
