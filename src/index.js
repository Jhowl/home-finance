const express = require("express");
const healthRoutes = require("./routes/health");
const expenseRoutes = require("./routes/expenses");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(express.json({ limit: "256kb" }));

app.use("/health", healthRoutes);
app.use("/expenses", expenseRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
