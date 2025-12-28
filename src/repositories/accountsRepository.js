const { pool } = require("../config/db");

async function list() {
  const { rows } = await pool.query(
    "SELECT id, name, type, currency, created_by_user_id, created_at FROM accounts ORDER BY name ASC"
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    "SELECT id, name, type, currency, created_by_user_id, created_at FROM accounts WHERE id = $1",
    [id]
  );
  return rows[0];
}

async function create(data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const accountResult = await client.query(
      "INSERT INTO accounts (name, type, currency, created_by_user_id) VALUES ($1, $2, $3, $4) RETURNING id, name, type, currency, created_by_user_id, created_at",
      [data.name, data.type, data.currency, data.created_by_user_id]
    );
    const account = accountResult.rows[0];

    await client.query(
      "INSERT INTO account_members (account_id, user_id, role) VALUES ($1, $2, 'owner')",
      [account.id, data.created_by_user_id]
    );

    const otherMembers = data.member_ids.filter((id) => id !== data.created_by_user_id);
    if (otherMembers.length) {
      await client.query(
        "INSERT INTO account_members (account_id, user_id, role) SELECT $1, UNNEST($2::int[]), 'member'",
        [account.id, otherMembers]
      );
    }

    await client.query("COMMIT");
    return account;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE accounts
     SET name = $1, type = $2, currency = $3
     WHERE id = $4
     RETURNING id, name, type, currency, created_by_user_id, created_at`,
    [data.name, data.type, data.currency, id]
  );
  return rows[0];
}

async function remove(id) {
  const { rows } = await pool.query("DELETE FROM accounts WHERE id = $1 RETURNING id", [id]);
  return rows[0];
}

module.exports = {
  list,
  findById,
  create,
  update,
  remove,
};
