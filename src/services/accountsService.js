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

  return {
    name: input.name.trim(),
    type,
    currency,
    created_by_user_id: createdByUserId,
    member_ids: uniqueMembers,
  };
}

async function listAccounts() {
  return accountsRepository.list();
}

async function createAccount(payload) {
  const data = validateAccount(payload);
  return accountsRepository.create(data);
}

module.exports = {
  listAccounts,
  createAccount,
};
