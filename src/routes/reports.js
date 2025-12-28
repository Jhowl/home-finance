const express = require("express");
const reportsController = require("../controllers/reportsController");

const router = express.Router();

router.get("/summary", reportsController.summary);
router.get("/by-category", reportsController.byCategory);
router.get("/by-account", reportsController.byAccount);
router.get("/monthly-trend", reportsController.monthlyTrend);

module.exports = router;
