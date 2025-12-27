const transactionsService = require("../services/transactionsService");

async function listTransactions(req, res, next) {
  try {
    const transactions = await transactionsService.listTransactions(req.query);
    res.json({ data: transactions });
  } catch (err) {
    next(err);
  }
}

async function createTransaction(req, res, next) {
  try {
    const transaction = await transactionsService.createTransaction(req.body);
    res.status(201).json({ data: transaction });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTransactions,
  createTransaction,
};
