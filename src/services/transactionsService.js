const transactionsRepository = require("../repositories/transactionsRepository");

function toInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const err = new Error(`${fieldName} must be a positive integer`);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function parseMonth(value) {
  if (!value) {
    return null;
  }
  if (!/^\d{4}-\d{2}$/.test(value)) {
    const err = new Error("month must be in YYYY-MM format");
    err.status = 400;
    throw err;
  }
  const [year, month] = value.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function validateTransaction(input) {
  if (!input || typeof input !== "object") {
    const err = new Error("Invalid payload");
    err.status = 400;
    throw err;
  }

  const accountId = toInteger(input.account_id, "account_id");
  const userId = toInteger(input.user_id, "user_id");
  const amount = Number(input.amount_cents);
  if (!Number.isInteger(amount) || amount < 0) {
    const err = new Error("amount_cents must be a non-negative integer");
    err.status = 400;
    throw err;
  }

  const kind = input.kind ? String(input.kind).trim() : "";
  if (!["expense", "income"].includes(kind)) {
    const err = new Error("kind must be 'expense' or 'income'");
    err.status = 400;
    throw err;
  }

  const spentAt = input.spent_at ? new Date(input.spent_at) : new Date();
  if (Number.isNaN(spentAt.getTime())) {
    const err = new Error("spent_at must be a valid datetime");
    err.status = 400;
    throw err;
  }

  const categoryId = input.category_id ? toInteger(input.category_id, "category_id") : null;

  return {
    account_id: accountId,
    user_id: userId,
    category_id: categoryId,
    amount_cents: amount,
    kind,
    description: input.description ? String(input.description).trim() : null,
    spent_at: spentAt,
  };
}

function parseFilters(query) {
  const filters = {};

  if (query.account_id) {
    filters.account_id = toInteger(query.account_id, "account_id");
  }
  if (query.user_id) {
    filters.user_id = toInteger(query.user_id, "user_id");
  }
  if (query.category_id) {
    filters.category_id = toInteger(query.category_id, "category_id");
  }
  if (query.kind) {
    const kind = String(query.kind).trim();
    if (!["expense", "income"].includes(kind)) {
      const err = new Error("kind must be 'expense' or 'income'");
      err.status = 400;
      throw err;
    }
    filters.kind = kind;
  }
  if (query.month) {
    const { start, end } = parseMonth(query.month);
    filters.month_start = start;
    filters.month_end = end;
  }

  return filters;
}

async function listTransactions(query) {
  const filters = parseFilters(query);
  return transactionsRepository.list(filters);
}

async function createTransaction(payload) {
  const data = validateTransaction(payload);
  return transactionsRepository.create(data);
}

module.exports = {
  listTransactions,
  createTransaction,
};
