const express = require("express");
const transactionsController = require("../controllers/transactionsController");

const router = express.Router();

router.get("/", transactionsController.listTransactions);
router.post("/", transactionsController.createTransaction);

module.exports = router;
