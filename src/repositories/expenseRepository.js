const { pool } = require("../config/db");

async function list() {
  const { rows } = await pool.query(
    "SELECT id, amount_cents, category, note, spent_at, created_at FROM expenses ORDER BY spent_at DESC"
  );
  return rows;
}

async function create(data) {
  const { rows } = await pool.query(
    "INSERT INTO expenses (amount_cents, category, note, spent_at) VALUES ($1, $2, $3, $4) RETURNING id, amount_cents, category, note, spent_at, created_at",
    [data.amount_cents, data.category, data.note, data.spent_at]
  );
  return rows[0];
}

module.exports = {
  list,
  create,
};
