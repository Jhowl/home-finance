const expenseRepository = require("../repositories/expenseRepository");

function validateExpense(input) {
  if (!input || typeof input !== "object") {
    const err = new Error("Invalid payload");
    err.status = 400;
    throw err;
  }

  const amount = Number(input.amount_cents);
  if (!Number.isInteger(amount) || amount < 0) {
    const err = new Error("amount_cents must be a non-negative integer");
    err.status = 400;
    throw err;
  }

  if (!input.category || typeof input.category !== "string") {
    const err = new Error("category is required");
    err.status = 400;
    throw err;
  }

  return {
    amount_cents: amount,
    category: input.category.trim(),
    note: input.note ? String(input.note) : null,
    spent_at: input.spent_at ? new Date(input.spent_at) : new Date(),
  };
}

async function listExpenses() {
  return expenseRepository.list();
}

async function createExpense(payload) {
  const data = validateExpense(payload);
  return expenseRepository.create(data);
}

module.exports = {
  listExpenses,
  createExpense,
};
