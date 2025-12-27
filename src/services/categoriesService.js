const categoriesRepository = require("../repositories/categoriesRepository");

function validateCategory(input) {
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

  return {
    name: input.name.trim(),
    group_name: input.group_name ? String(input.group_name).trim() : null,
    color: input.color ? String(input.color).trim() : null,
  };
}

async function listCategories() {
  return categoriesRepository.list();
}

async function createCategory(payload) {
  const data = validateCategory(payload);
  return categoriesRepository.create(data);
}

module.exports = {
  listCategories,
  createCategory,
};
