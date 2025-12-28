const express = require("express");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const accountsRoutes = require("./routes/accounts");
const categoriesRoutes = require("./routes/categories");
const transactionsRoutes = require("./routes/transactions");
const reportsRoutes = require("./routes/reports");
const { errorHandler } = require("./middlewares/errorHandler");
const { ensureAdminUser, ensureDemoData } = require("./services/seedService");

const app = express();

app.use(express.json({ limit: "256kb" }));

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/reports", reportsRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT || 3000);

async function start() {
  await ensureAdminUser();
  await ensureDemoData();
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

start();
