const express = require("express");
const accountsController = require("../controllers/accountsController");

const router = express.Router();

router.get("/", accountsController.listAccounts);
router.post("/", accountsController.createAccount);
router.patch("/:id", accountsController.updateAccount);
router.delete("/:id", accountsController.deleteAccount);

module.exports = router;
