const accountsService = require("../services/accountsService");

async function listAccounts(req, res, next) {
  try {
    const accounts = await accountsService.listAccounts();
    res.json({ data: accounts });
  } catch (err) {
    next(err);
  }
}

async function createAccount(req, res, next) {
  try {
    const account = await accountsService.createAccount(req.body);
    res.status(201).json({ data: account });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAccounts,
  createAccount,
};
