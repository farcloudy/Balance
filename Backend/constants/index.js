const BOOK_STATUS = {
    ACTIVE: 'active',
    ARCHIVED: 'archived'
}

const ACCOUNT_TYPE = {
    ASSET: 'asset',
    LIABILITY: 'liability',
    EQUITY: 'equity',
    INCOME: 'income',
    EXPENSE: 'expense'
}

const ACCOUNT_CONSTANTS = {
    MAX_LEVEL: 5,
    CURRENCY_MULTIPLIER: 100
}

const QUERY_PARAMS = {
    TRUE: 'true',
    FALSE: 'false',
    NULL: 'null'
}

const DEFAULT_CURRENCY = 'CNY'
const DEFAULT_FISCAL_YEAR_START = 1

module.exports = {
    BOOK_STATUS,
    ACCOUNT_TYPE,
    ACCOUNT_CONSTANTS,
    QUERY_PARAMS,
    DEFAULT_CURRENCY,
    DEFAULT_FISCAL_YEAR_START
}
