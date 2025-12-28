const reportsService = require("../services/reportsService");

async function summary(req, res, next) {
  try {
    const data = await reportsService.summary(req.query);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function byCategory(req, res, next) {
  try {
    const data = await reportsService.byCategory(req.query);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function byAccount(req, res, next) {
  try {
    const data = await reportsService.byAccount(req.query);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function monthlyTrend(req, res, next) {
  try {
    const data = await reportsService.monthlyTrend(req.query);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function accountBalances(req, res, next) {
  try {
    const data = await reportsService.accountBalances();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  summary,
  byCategory,
  byAccount,
  monthlyTrend,
  accountBalances,
};
