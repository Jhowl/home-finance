const express = require("express");
const accountsController = require("../controllers/accountsController");

const router = express.Router();

router.get("/", accountsController.listAccounts);
router.post("/", accountsController.createAccount);

module.exports = router;
