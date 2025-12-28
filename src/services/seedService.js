const bcrypt = require("bcryptjs");
const usersRepository = require("../repositories/usersRepository");

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL ? String(process.env.ADMIN_EMAIL).trim().toLowerCase() : "";
  const password = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD) : "";

  if (!email || !password) {
    return;
  }

  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await usersRepository.create({
    name: "Admin",
    email,
    password_hash: passwordHash,
    role: "admin",
  });
}

module.exports = {
  ensureAdminUser,
};
