const expenseService = require("../services/expenseService");

async function listExpenses(req, res, next) {
  try {
    const expenses = await expenseService.listExpenses();
    res.json({ data: expenses });
  } catch (err) {
    next(err);
  }
}

async function createExpense(req, res, next) {
  try {
    const expense = await expenseService.createExpense(req.body);
    res.status(201).json({ data: expense });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listExpenses,
  createExpense,
};
