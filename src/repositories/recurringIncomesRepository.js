const { pool } = require("../config/db");

async function list() {
  const { rows } = await pool.query(
    `SELECT
      r.id,
      r.account_id,
      r.user_id,
      r.category_id,
      r.amount_cents,
      r.cadence,
      r.start_date,
      r.next_run_at,
      r.last_run_at,
      r.description,
      r.created_at,
      a.name AS account_name,
      c.name AS category_name
     FROM recurring_incomes r
     JOIN accounts a ON a.id = r.account_id
     LEFT JOIN categories c ON c.id = r.category_id
     ORDER BY r.next_run_at ASC`
  );
  return rows;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO recurring_incomes
      (account_id, user_id, category_id, amount_cents, cadence, start_date, next_run_at, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, account_id, user_id, category_id, amount_cents, cadence, start_date, next_run_at, description, created_at`,
    [
      data.account_id,
      data.user_id,
      data.category_id,
      data.amount_cents,
      data.cadence,
      data.start_date,
      data.next_run_at,
      data.description,
    ]
  );
  return rows[0];
}

async function listDue(asOfDate) {
  const { rows } = await pool.query(
    `SELECT
      r.id,
      r.account_id,
      r.user_id,
      r.category_id,
      r.amount_cents,
      r.cadence,
      r.start_date,
      r.next_run_at,
      r.description
     FROM recurring_incomes r
     WHERE r.next_run_at <= $1
     ORDER BY r.next_run_at ASC`,
    [asOfDate]
  );
  return rows;
}

async function updateNextRun(id, nextRunAt, lastRunAt, client) {
  const runner = client || pool;
  await runner.query(
    "UPDATE recurring_incomes SET next_run_at = $1, last_run_at = $2 WHERE id = $3",
    [nextRunAt, lastRunAt, id]
  );
}

module.exports = {
  list,
  create,
  listDue,
  updateNextRun,
};
