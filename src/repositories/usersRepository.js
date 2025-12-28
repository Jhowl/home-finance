const { pool } = require("../config/db");

function serialize(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
  };
}

async function list() {
  const { rows } = await pool.query(
    "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
  );
  return rows;
}

async function create(data) {
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, password_hash, role, created_at",
    [data.name, data.email, data.password_hash, data.role]
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    "SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1",
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    "SELECT id, name, email, password_hash, role, created_at FROM users WHERE id = $1",
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  list,
  create,
  findByEmail,
  findById,
  serialize,
};
