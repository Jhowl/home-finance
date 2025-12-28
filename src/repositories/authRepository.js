const { pool } = require("../config/db");

async function createSession(data) {
  const { rows } = await pool.query(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id, user_id, token, expires_at, created_at",
    [data.user_id, data.token, data.expires_at]
  );
  return rows[0];
}

async function findSession(token) {
  const { rows } = await pool.query(
    "SELECT id, user_id, token, expires_at FROM sessions WHERE token = $1 AND expires_at > NOW()",
    [token]
  );
  return rows[0] || null;
}

async function deleteSession(token) {
  await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
}

module.exports = {
  createSession,
  findSession,
  deleteSession,
};
