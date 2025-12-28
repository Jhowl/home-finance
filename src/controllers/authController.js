const authService = require("../services/authService");

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.headers.authorization);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.me(req.headers.authorization);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  logout,
  me,
};
