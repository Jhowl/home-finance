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

function validateCategoryUpdate(input) {
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
  if (input.group_name !== undefined) {
    updates.group_name = input.group_name ? String(input.group_name).trim() : null;
  }
  if (input.color !== undefined) {
    updates.color = input.color ? String(input.color).trim() : null;
  }

  if (!Object.keys(updates).length) {
    const err = new Error("At least one field is required");
    err.status = 400;
    throw err;
  }

  return updates;
}

async function updateCategory(id, payload) {
  const updates = validateCategoryUpdate(payload);
  const updated = await categoriesRepository.update(id, {
    name: updates.name,
    group_name: updates.group_name ?? null,
    color: updates.color ?? null,
  });
  if (!updated) {
    const err = new Error("Category not found");
    err.status = 404;
    throw err;
  }
  return updated;
}

async function deleteCategory(id) {
  const removed = await categoriesRepository.remove(id);
  if (!removed) {
    const err = new Error("Category not found");
    err.status = 404;
    throw err;
  }
  return removed;
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
