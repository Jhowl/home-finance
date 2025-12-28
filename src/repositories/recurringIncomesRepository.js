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

async function findById(id) {
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
      r.description
     FROM recurring_incomes r
     WHERE r.id = $1`,
    [id]
  );
  return rows[0];
}

async function updateNextRun(id, nextRunAt, lastRunAt, client) {
  const runner = client || pool;
  await runner.query(
    "UPDATE recurring_incomes SET next_run_at = $1, last_run_at = $2 WHERE id = $3",
    [nextRunAt, lastRunAt, id]
  );
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE recurring_incomes
     SET amount_cents = $1,
         cadence = $2,
         description = $3,
         next_run_at = $4
     WHERE id = $5
     RETURNING id, account_id, user_id, category_id, amount_cents, cadence, start_date, next_run_at, last_run_at, description, created_at`,
    [data.amount_cents, data.cadence, data.description, data.next_run_at, id]
  );
  return rows[0];
}

async function remove(id) {
  const { rows } = await pool.query(
    "DELETE FROM recurring_incomes WHERE id = $1 RETURNING id",
    [id]
  );
  return rows[0];
}

module.exports = {
  list,
  create,
  listDue,
  findById,
  updateNextRun,
  update,
  remove,
};
