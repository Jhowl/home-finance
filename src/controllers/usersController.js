const usersService = require("../services/usersService");

async function listUsers(req, res, next) {
  try {
    const users = await usersService.listUsers();
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  createUser,
};
