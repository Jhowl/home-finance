const { pool } = require("../config/db");

async function summary(start, end) {
  const { rows } = await pool.query(
    `SELECT
      COALESCE(SUM(CASE WHEN kind = 'income' THEN amount_cents ELSE 0 END), 0) AS income_cents,
      COALESCE(SUM(CASE WHEN kind = 'expense' THEN amount_cents ELSE 0 END), 0) AS expense_cents
     FROM transactions
     WHERE spent_at >= $1 AND spent_at < $2`,
    [start, end]
  );
  return rows[0];
}

async function byCategory(start, end) {
  const { rows } = await pool.query(
    `SELECT
      COALESCE(c.name, 'Uncategorized') AS label,
      SUM(t.amount_cents) AS value_cents
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.kind = 'expense' AND t.spent_at >= $1 AND t.spent_at < $2
     GROUP BY COALESCE(c.name, 'Uncategorized')
     ORDER BY value_cents DESC`,
    [start, end]
  );
  return rows;
}

async function byAccount(start, end) {
  const { rows } = await pool.query(
    `SELECT
      a.name AS label,
      SUM(t.amount_cents) AS value_cents
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     WHERE t.kind = 'expense' AND t.spent_at >= $1 AND t.spent_at < $2
     GROUP BY a.name
     ORDER BY value_cents DESC`,
    [start, end]
  );
  return rows;
}

async function monthlyTrend(start, end) {
  const { rows } = await pool.query(
    `SELECT
      to_char(date_trunc('month', spent_at), 'YYYY-MM') AS month,
      COALESCE(SUM(CASE WHEN kind = 'income' THEN amount_cents ELSE 0 END), 0) AS income_cents,
      COALESCE(SUM(CASE WHEN kind = 'expense' THEN amount_cents ELSE 0 END), 0) AS expense_cents
     FROM transactions
     WHERE spent_at >= $1 AND spent_at < $2
     GROUP BY date_trunc('month', spent_at)
     ORDER BY date_trunc('month', spent_at) ASC`,
    [start, end]
  );
  return rows;
}

async function accountBalances() {
  const { rows } = await pool.query(
    `SELECT
      a.id AS account_id,
      a.name AS account_name,
      COALESCE(SUM(CASE WHEN t.kind = 'income' THEN t.amount_cents ELSE -t.amount_cents END), 0) AS balance_cents
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
     GROUP BY a.id, a.name
     ORDER BY a.name ASC`
  );
  return rows;
}

module.exports = {
  summary,
  byCategory,
  byAccount,
  monthlyTrend,
  accountBalances,
};
