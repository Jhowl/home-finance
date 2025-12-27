const { pool } = require("../config/db");

async function list() {
  const { rows } = await pool.query(
    "SELECT id, name, group_name, color, created_at FROM categories ORDER BY name ASC"
  );
  return rows;
}

async function create(data) {
  const { rows } = await pool.query(
    "INSERT INTO categories (name, group_name, color) VALUES ($1, $2, $3) RETURNING id, name, group_name, color, created_at",
    [data.name, data.group_name, data.color]
  );
  return rows[0];
}

module.exports = {
  list,
  create,
};
