const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const usersRepository = require("../repositories/usersRepository");

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL ? String(process.env.ADMIN_EMAIL).trim().toLowerCase() : "";
  const password = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD) : "";

  if (!email || !password) {
    return;
  }

  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await usersRepository.create({
    name: "Admin",
    email,
    password_hash: passwordHash,
    role: "admin",
  });
}

function isSeedEnabled() {
  return String(process.env.SEED_DEMO || "").toLowerCase() === "true";
}

async function ensureDemoData() {
  if (!isSeedEnabled()) {
    return;
  }

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  if (rows[0].count > 0) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const password = process.env.DEMO_PASSWORD ? String(process.env.DEMO_PASSWORD) : "demo123";
    const passwordHash = await bcrypt.hash(password, 12);

    const usersResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin'),
              ($4, $5, $6, 'member')
       RETURNING id, email`,
      [
        "Alex",
        "alex@home.local",
        passwordHash,
        "Jamie",
        "jamie@home.local",
        passwordHash,
      ]
    );

    const userMap = new Map(usersResult.rows.map((row) => [row.email, row.id]));
    const alexId = userMap.get("alex@home.local");
    const jamieId = userMap.get("jamie@home.local");

    const categoriesResult = await client.query(
      `INSERT INTO categories (name, group_name, color)
       VALUES
         ('Groceries', 'Essentials', '#6aa84f'),
         ('Rent', 'Housing', '#e69138'),
         ('Utilities', 'Housing', '#6d9eeb'),
         ('Dining Out', 'Lifestyle', '#cc0000'),
         ('Salary', 'Income', '#3d85c6'),
         ('Freelance', 'Income', '#674ea7')
       RETURNING id, name`
    );

    const categoryMap = new Map(categoriesResult.rows.map((row) => [row.name, row.id]));

    const accountsResult = await client.query(
      `INSERT INTO accounts (name, type, currency, created_by_user_id)
       VALUES
         ('Family Checking', 'bank', 'USD', $1),
         ('Visa Rewards', 'credit_card', 'USD', $1),
         ('Cash Wallet', 'wallet', 'USD', $2)
       RETURNING id, name`,
      [alexId, jamieId]
    );

    const accountMap = new Map(accountsResult.rows.map((row) => [row.name, row.id]));

    await client.query(
      `INSERT INTO account_members (account_id, user_id, role)
       VALUES
         ($1, $3, 'owner'),
         ($1, $4, 'member'),
         ($2, $3, 'owner'),
         ($2, $4, 'member'),
         ($5, $4, 'owner'),
         ($5, $3, 'member')`,
      [
        accountMap.get("Family Checking"),
        accountMap.get("Visa Rewards"),
        accountMap.get("Cash Wallet"),
        alexId,
        jamieId,
      ]
    );

    const now = Date.now();
    const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000);

    const transactions = [
      {
        account_id: accountMap.get("Family Checking"),
        user_id: alexId,
        category_id: categoryMap.get("Salary"),
        amount_cents: 320000,
        kind: "income",
        description: "Monthly salary",
        spent_at: daysAgo(25),
      },
      {
        account_id: accountMap.get("Family Checking"),
        user_id: alexId,
        category_id: categoryMap.get("Rent"),
        amount_cents: 120000,
        kind: "expense",
        description: "Apartment rent",
        spent_at: daysAgo(22),
      },
      {
        account_id: accountMap.get("Visa Rewards"),
        user_id: jamieId,
        category_id: categoryMap.get("Groceries"),
        amount_cents: 18500,
        kind: "expense",
        description: "Groceries - weekly",
        spent_at: daysAgo(10),
      },
      {
        account_id: accountMap.get("Visa Rewards"),
        user_id: jamieId,
        category_id: categoryMap.get("Dining Out"),
        amount_cents: 5400,
        kind: "expense",
        description: "Dinner out",
        spent_at: daysAgo(6),
      },
      {
        account_id: accountMap.get("Cash Wallet"),
        user_id: jamieId,
        category_id: categoryMap.get("Utilities"),
        amount_cents: 7600,
        kind: "expense",
        description: "Internet bill",
        spent_at: daysAgo(5),
      },
      {
        account_id: accountMap.get("Family Checking"),
        user_id: alexId,
        category_id: categoryMap.get("Freelance"),
        amount_cents: 85000,
        kind: "income",
        description: "Freelance project",
        spent_at: daysAgo(2),
      },
    ];

    for (const entry of transactions) {
      await client.query(
        `INSERT INTO transactions
          (account_id, user_id, category_id, amount_cents, kind, description, spent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entry.account_id,
          entry.user_id,
          entry.category_id,
          entry.amount_cents,
          entry.kind,
          entry.description,
          entry.spent_at,
        ]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  ensureAdminUser,
  ensureDemoData,
};
