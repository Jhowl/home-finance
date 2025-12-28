const bcrypt = require("bcryptjs");
const usersRepository = require("../repositories/usersRepository");

const USER_ROLES = new Set(["admin", "member"]);

function validateUser(input) {
  if (!input || typeof input !== "object") {
    const err = new Error("Invalid payload");
    err.status = 400;
    throw err;
  }

  if (!input.name || typeof input.name !== "string") {
    const err = new Error("name is required");
    err.status = 400;
    throw err;
  }

  const email = input.email ? String(input.email).trim().toLowerCase() : "";
  if (!email) {
    const err = new Error("email is required");
    err.status = 400;
    throw err;
  }

  const password = input.password ? String(input.password) : "";
  if (password.length < 6) {
    const err = new Error("password must be at least 6 characters");
    err.status = 400;
    throw err;
  }

  const role = input.role ? String(input.role).trim() : "member";
  if (!USER_ROLES.has(role)) {
    const err = new Error("role must be admin or member");
    err.status = 400;
    throw err;
  }

  return {
    name: input.name.trim(),
    email,
    password,
    role,
  };
}

async function listUsers() {
  return usersRepository.list();
}

async function createUser(payload) {
  const data = validateUser(payload);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const created = await usersRepository.create({
    name: data.name,
    email: data.email,
    password_hash: passwordHash,
    role: data.role,
  });
  return usersRepository.serialize(created);
}

module.exports = {
  listUsers,
  createUser,
};
