const recurringIncomesRepository = require("../repositories/recurringIncomesRepository");

const CADENCES = new Set(["weekly", "biweekly", "monthly"]);

function toInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const err = new Error(`${fieldName} must be a positive integer`);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function parseDate(value, fieldName) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    const err = new Error(`${fieldName} must be a valid date`);
    err.status = 400;
    throw err;
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function computeNextRun(startDate, cadence) {
  const next = new Date(startDate);
  if (cadence === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7);
  } else if (cadence === "biweekly") {
    next.setUTCDate(next.getUTCDate() + 14);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

function computeNextRunFrom(currentDate, cadence) {
  return computeNextRun(currentDate, cadence);
}

function validateRecurringIncome(input) {
  if (!input || typeof input !== "object") {
    const err = new Error("Invalid payload");
    err.status = 400;
    throw err;
  }

  const accountId = toInteger(input.account_id, "account_id");
  const userId = toInteger(input.user_id, "user_id");
  const amount = Number(input.amount_cents);
  if (!Number.isInteger(amount) || amount < 0) {
    const err = new Error("amount_cents must be a non-negative integer");
    err.status = 400;
    throw err;
  }

  const cadence = input.cadence ? String(input.cadence).trim() : "";
  if (!CADENCES.has(cadence)) {
    const err = new Error("cadence must be weekly, biweekly, or monthly");
    err.status = 400;
    throw err;
  }

  const startDate = parseDate(input.start_date, "start_date");
  const nextRunAt = computeNextRun(startDate, cadence);
  const categoryId = input.category_id ? toInteger(input.category_id, "category_id") : null;

  return {
    account_id: accountId,
    user_id: userId,
    category_id: categoryId,
    amount_cents: amount,
    cadence,
    start_date: startDate,
    next_run_at: nextRunAt,
    description: input.description ? String(input.description).trim() : null,
  };
}

async function listRecurringIncomes() {
  return recurringIncomesRepository.list();
}

async function createRecurringIncome(payload) {
  const data = validateRecurringIncome(payload);
  return recurringIncomesRepository.create(data);
}

function validateRecurringUpdate(input) {
  if (!input || typeof input !== "object") {
    const err = new Error("Invalid payload");
    err.status = 400;
    throw err;
  }

  const updates = {};
  if (input.amount_cents !== undefined) {
    const amount = Number(input.amount_cents);
    if (!Number.isInteger(amount) || amount < 0) {
      const err = new Error("amount_cents must be a non-negative integer");
      err.status = 400;
      throw err;
    }
    updates.amount_cents = amount;
  }
  if (input.cadence !== undefined) {
    const cadence = String(input.cadence).trim();
    if (!CADENCES.has(cadence)) {
      const err = new Error("cadence must be weekly, biweekly, or monthly");
      err.status = 400;
      throw err;
    }
    updates.cadence = cadence;
  }
  if (input.description !== undefined) {
    updates.description = input.description ? String(input.description).trim() : null;
  }

  if (!Object.keys(updates).length) {
    const err = new Error("At least one field is required");
    err.status = 400;
    throw err;
  }

  return updates;
}

async function updateRecurringIncome(id, payload) {
  const updates = validateRecurringUpdate(payload);
  const current = await recurringIncomesRepository.findById(id);
  if (!current) {
    const err = new Error("Recurring income not found");
    err.status = 404;
    throw err;
  }

  const cadence = updates.cadence ?? current.cadence;
  const amount = updates.amount_cents ?? current.amount_cents;
  const description = updates.description ?? current.description;
  const nextRunAt = updates.cadence
    ? computeNextRunFrom(new Date(), cadence)
    : new Date(current.next_run_at);

  return recurringIncomesRepository.update(id, {
    amount_cents: amount,
    cadence,
    description,
    next_run_at: nextRunAt,
  });
}

async function deleteRecurringIncome(id) {
  const removed = await recurringIncomesRepository.remove(id);
  if (!removed) {
    const err = new Error("Recurring income not found");
    err.status = 404;
    throw err;
  }
  return removed;
}

async function runDueRecurringIncomes(pool, asOfDate = new Date()) {
  const dayStart = new Date(
    Date.UTC(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth(), asOfDate.getUTCDate())
  );
  const due = await recurringIncomesRepository.listDue(dayStart);
  if (!due.length) {
    return { created: 0 };
  }

  let created = 0;
  for (const item of due) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const spentAt = new Date(item.next_run_at);

      await client.query(
        `INSERT INTO transactions
          (account_id, user_id, category_id, amount_cents, kind, description, spent_at)
         VALUES ($1, $2, $3, $4, 'income', $5, $6)`,
        [
          item.account_id,
          item.user_id,
          item.category_id,
          item.amount_cents,
          item.description || "Recurring income",
          spentAt,
        ]
      );

      let nextRun = new Date(item.next_run_at);
      const guardLimit = 24;
      let guard = 0;
      while (nextRun <= dayStart && guard < guardLimit) {
        nextRun = computeNextRunFrom(nextRun, item.cadence);
        guard += 1;
      }

      await recurringIncomesRepository.updateNextRun(item.id, nextRun, spentAt, client);
      await client.query("COMMIT");
      created += 1;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  return { created };
}

module.exports = {
  listRecurringIncomes,
  createRecurringIncome,
  updateRecurringIncome,
  deleteRecurringIncome,
  runDueRecurringIncomes,
};
