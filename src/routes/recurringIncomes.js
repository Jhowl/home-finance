const express = require("express");
const recurringIncomesController = require("../controllers/recurringIncomesController");

const router = express.Router();

router.get("/", recurringIncomesController.listRecurringIncomes);
router.post("/", recurringIncomesController.createRecurringIncome);
router.post("/run", recurringIncomesController.runRecurringIncomes);

module.exports = router;
