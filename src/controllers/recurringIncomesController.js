const recurringIncomesService = require("../services/recurringIncomesService");
const { pool } = require("../config/db");

async function listRecurringIncomes(req, res, next) {
  try {
    const incomes = await recurringIncomesService.listRecurringIncomes();
    res.json({ data: incomes });
  } catch (err) {
    next(err);
  }
}

async function createRecurringIncome(req, res, next) {
  try {
    const income = await recurringIncomesService.createRecurringIncome(req.body);
    res.status(201).json({ data: income });
  } catch (err) {
    next(err);
  }
}

async function runRecurringIncomes(req, res, next) {
  try {
    const result = await recurringIncomesService.runDueRecurringIncomes(pool);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRecurringIncomes,
  createRecurringIncome,
  runRecurringIncomes,
};
