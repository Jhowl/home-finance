const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const authRepository = require("../repositories/authRepository");
const usersRepository = require("../repositories/usersRepository");

const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 168);

function parseAuthorization(headerValue) {
  if (!headerValue || typeof headerValue !== "string") {
    return null;
  }
  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

async function login(payload) {
  if (!payload || typeof payload !== "object") {
    const err = new Error("Invalid payload");
    err.status = 400;
    throw err;
  }

  const email = payload.email ? String(payload.email).trim().toLowerCase() : "";
  const password = payload.password ? String(payload.password) : "";

  if (!email || !password) {
    const err = new Error("email and password are required");
    err.status = 400;
    throw err;
  }

  const user = await usersRepository.findByEmail(email);
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  await authRepository.createSession({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  });

  return {
    token,
    user: usersRepository.serialize(user),
  };
}

async function logout(authorizationHeader) {
  const token = parseAuthorization(authorizationHeader);
  if (!token) {
    const err = new Error("Authorization token is required");
    err.status = 401;
    throw err;
  }
  await authRepository.deleteSession(token);
}

async function me(authorizationHeader) {
  const token = parseAuthorization(authorizationHeader);
  if (!token) {
    const err = new Error("Authorization token is required");
    err.status = 401;
    throw err;
  }

  const session = await authRepository.findSession(token);
  if (!session) {
    const err = new Error("Session expired");
    err.status = 401;
    throw err;
  }

  const user = await usersRepository.findById(session.user_id);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return usersRepository.serialize(user);
}

module.exports = {
  login,
  logout,
  me,
};
