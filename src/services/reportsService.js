const reportsRepository = require("../repositories/reportsRepository");

function parseMonth(value) {
  if (!value) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { start, end };
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

function parseMonths(value) {
  if (!value) {
    return 12;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 60) {
    const err = new Error("months must be an integer between 1 and 60");
    err.status = 400;
    throw err;
  }
  return parsed;
}

async function summary(query) {
  const { start, end } = parseMonth(query.month);
  const totals = await reportsRepository.summary(start, end);
  return {
    income_cents: totals.income_cents,
    expense_cents: totals.expense_cents,
    net_cents: totals.income_cents - totals.expense_cents,
  };
}

async function byCategory(query) {
  const { start, end } = parseMonth(query.month);
  const rows = await reportsRepository.byCategory(start, end);
  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => row.value_cents),
  };
}

async function byAccount(query) {
  const { start, end } = parseMonth(query.month);
  const rows = await reportsRepository.byAccount(start, end);
  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => row.value_cents),
  };
}

async function monthlyTrend(query) {
  const months = parseMonths(query.months);
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const rows = await reportsRepository.monthlyTrend(start, end);

  return {
    labels: rows.map((row) => row.month),
    income: rows.map((row) => row.income_cents),
    expense: rows.map((row) => row.expense_cents),
  };
}

async function accountBalances() {
  const rows = await reportsRepository.accountBalances();
  return {
    accounts: rows.map((row) => ({
      account_id: row.account_id,
      account_name: row.account_name,
      balance_cents: Number(row.balance_cents),
    })),
  };
}

module.exports = {
  summary,
  byCategory,
  byAccount,
  monthlyTrend,
  accountBalances,
};
