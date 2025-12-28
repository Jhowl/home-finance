const express = require("express");
const path = require("path");
const fs = require("fs");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const accountsRoutes = require("./routes/accounts");
const categoriesRoutes = require("./routes/categories");
const transactionsRoutes = require("./routes/transactions");
const reportsRoutes = require("./routes/reports");
const recurringIncomesRoutes = require("./routes/recurringIncomes");
const { pool } = require("./config/db");
const { runDueRecurringIncomes } = require("./services/recurringIncomesService");
const { errorHandler } = require("./middlewares/errorHandler");
const { ensureAdminUser, ensureDemoData } = require("./services/seedService");

const app = express();

app.use(express.json({ limit: "256kb" }));

const distPath = path.join(__dirname, "..", "client", "dist");
const publicPath = path.join(__dirname, "..", "public");
const staticPath = fs.existsSync(distPath) ? distPath : publicPath;

app.use(express.static(staticPath));

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/recurring-incomes", recurringIncomesRoutes);

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return next();
  }
  return res.sendFile(path.join(staticPath, "index.html"));
});

app.use(errorHandler);

const port = Number(process.env.PORT || 3000);

async function start() {
  await ensureAdminUser();
  await ensureDemoData();
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });

  const enabled = String(process.env.ENABLE_RECURRING_RUNNER || "true").toLowerCase() === "true";
  if (enabled) {
    const minutes = Number(process.env.RECURRING_RUNNER_INTERVAL_MINUTES || 60);
    const interval = Math.max(5, minutes) * 60 * 1000;
    setInterval(() => {
      runDueRecurringIncomes(pool).catch((err) => {
        console.error("Recurring income runner failed:", err.message);
      });
    }, interval);
  }
}

start();
