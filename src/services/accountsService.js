const accountsRepository = require("../repositories/accountsRepository");

const ACCOUNT_TYPES = new Set([
  "bank",
  "credit_card",
  "wallet",
  "cash",
  "investment",
  "loan",
  "other",
]);

function toInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const err = new Error(`${fieldName} must be a positive integer`);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function validateAccount(input) {
  if (!input || typeof input !== "object") {
    const err = new Error("Invalid payload");
    err.status = 400;
    throw err;
  }

  if (!input.name || typeof input.name !== "string") {
    const err = new Error("name is required");
    err.status = 400;
    throw err;
  }

  if (!input.type || typeof input.type !== "string") {
    const err = new Error("type is required");
    err.status = 400;
    throw err;
  }

  const type = input.type.trim();
  if (!ACCOUNT_TYPES.has(type)) {
    const err = new Error(`type must be one of: ${Array.from(ACCOUNT_TYPES).join(", ")}`);
    err.status = 400;
    throw err;
  }

  const createdByUserId = toInteger(input.created_by_user_id, "created_by_user_id");
  const currency = input.currency ? String(input.currency).trim().toUpperCase() : "USD";

  let memberIds = [];
  if (Array.isArray(input.member_ids)) {
    memberIds = input.member_ids.map((id) => toInteger(id, "member_ids"));
  }

  const uniqueMembers = Array.from(new Set([createdByUserId, ...memberIds]));
  const openingBalance = input.opening_balance_cents ?? input.initial_balance_cents ?? null;
  let openingBalanceCents = null;
  if (openingBalance !== null && openingBalance !== undefined && openingBalance !== "") {
    const parsed = Number(openingBalance);
    if (!Number.isInteger(parsed) || parsed < 0) {
      const err = new Error("opening_balance_cents must be a non-negative integer");
      err.status = 400;
      throw err;
    }
    openingBalanceCents = parsed;
  }

  return {
    name: input.name.trim(),
    type,
    currency,
    created_by_user_id: createdByUserId,
    member_ids: uniqueMembers,
    opening_balance_cents: openingBalanceCents,
  };
}

async function listAccounts() {
  return accountsRepository.list();
}

async function createAccount(payload) {
  const data = validateAccount(payload);
  return accountsRepository.create(data);
}

function validateAccountUpdate(input) {
  if (!input || typeof input !== "object") {
    const err = new Error("Invalid payload");
    err.status = 400;
    throw err;
  }

  const updates = {};
  if (input.name !== undefined) {
    if (!input.name || typeof input.name !== "string") {
      const err = new Error("name must be a non-empty string");
      err.status = 400;
      throw err;
    }
    updates.name = input.name.trim();
  }
  if (input.type !== undefined) {
    const type = String(input.type).trim();
    if (!ACCOUNT_TYPES.has(type)) {
      const err = new Error(`type must be one of: ${Array.from(ACCOUNT_TYPES).join(", ")}`);
      err.status = 400;
      throw err;
    }
    updates.type = type;
  }
  if (input.currency !== undefined) {
    updates.currency = String(input.currency).trim().toUpperCase();
  }

  if (!Object.keys(updates).length) {
    const err = new Error("At least one field is required");
    err.status = 400;
    throw err;
  }

  return updates;
}

async function updateAccount(id, payload) {
  const updates = validateAccountUpdate(payload);
  const existing = await accountsRepository.findById(id);
  if (!existing) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }
  const updated = await accountsRepository.update(id, {
    name: updates.name ?? existing.name,
    type: updates.type ?? existing.type,
    currency: updates.currency ?? existing.currency,
  });
  if (!updated) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }
  return updated;
}

async function deleteAccount(id) {
  const removed = await accountsRepository.remove(id);
  if (!removed) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }
  return removed;
}

module.exports = {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
};
