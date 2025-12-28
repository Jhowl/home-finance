const { pool } = require("../config/db");

function buildFilters(filters) {
  const conditions = [];
  const values = [];

  if (filters.account_id) {
    values.push(filters.account_id);
    conditions.push(`account_id = $${values.length}`);
  }
  if (filters.user_id) {
    values.push(filters.user_id);
    conditions.push(`user_id = $${values.length}`);
  }
  if (filters.category_id) {
    values.push(filters.category_id);
    conditions.push(`category_id = $${values.length}`);
  }
  if (filters.kind) {
    values.push(filters.kind);
    conditions.push(`kind = $${values.length}`);
  }
  if (filters.month_start && filters.month_end) {
    values.push(filters.month_start);
    conditions.push(`spent_at >= $${values.length}`);
    values.push(filters.month_end);
    conditions.push(`spent_at < $${values.length}`);
  }

  return { conditions, values };
}

async function list(filters) {
  const { conditions, values } = buildFilters(filters);
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT
      t.id,
      t.account_id,
      t.user_id,
      t.category_id,
      t.amount_cents,
      t.kind,
      t.description,
      t.spent_at,
      t.created_at,
      c.name AS category_name
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    ${whereClause}
    ORDER BY t.spent_at DESC
  `;
  const { rows } = await pool.query(query, values);
  return rows;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO transactions
      (account_id, user_id, category_id, amount_cents, kind, description, spent_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, account_id, user_id, category_id, amount_cents, kind, description, spent_at, created_at`,
    [
      data.account_id,
      data.user_id,
      data.category_id,
      data.amount_cents,
      data.kind,
      data.description,
      data.spent_at,
    ]
  );
  return rows[0];
}

module.exports = {
  list,
  create,
};
