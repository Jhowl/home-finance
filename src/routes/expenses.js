const express = require("express");
const expenseController = require("../controllers/expenseController");

const router = express.Router();

router.get("/", expenseController.listExpenses);
router.post("/", expenseController.createExpense);

module.exports = router;
