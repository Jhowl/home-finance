const categoriesService = require("../services/categoriesService");

async function listCategories(req, res, next) {
  try {
    const categories = await categoriesService.listCategories();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await categoriesService.createCategory(req.body);
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  createCategory,
};
