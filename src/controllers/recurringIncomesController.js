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

async function updateRecurringIncome(req, res, next) {
  try {
    const income = await recurringIncomesService.updateRecurringIncome(Number(req.params.id), req.body);
    res.json({ data: income });
  } catch (err) {
    next(err);
  }
}

async function deleteRecurringIncome(req, res, next) {
  try {
    await recurringIncomesService.deleteRecurringIncome(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRecurringIncomes,
  createRecurringIncome,
  runRecurringIncomes,
  updateRecurringIncome,
  deleteRecurringIncome,
};
