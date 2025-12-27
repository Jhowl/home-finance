const express = require("express");
const healthRoutes = require("./routes/health");
const accountsRoutes = require("./routes/accounts");
const categoriesRoutes = require("./routes/categories");
const transactionsRoutes = require("./routes/transactions");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(express.json({ limit: "256kb" }));

app.use("/health", healthRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/transactions", transactionsRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
