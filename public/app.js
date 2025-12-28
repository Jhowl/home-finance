const summaryCardsEl = document.getElementById("summaryCards");
const accountsGridEl = document.getElementById("accountsGrid");
const categoryChartEl = document.getElementById("categoryChart");
const trendChartEl = document.getElementById("trendChart");
const transactionsTableEl = document.getElementById("transactionsTable");
const monthPickerEl = document.getElementById("monthPicker");
const accountFilterEl = document.getElementById("accountFilter");
const refreshButtonEl = document.getElementById("refreshButton");
const statusCardEl = document.getElementById("statusCard");
const accountDetailEl = document.getElementById("accountDetail");
const accountDetailNameEl = document.getElementById("accountDetailName");
const accountDetailMetaEl = document.getElementById("accountDetailMeta");
const accountDetailMetricsEl = document.getElementById("accountDetailMetrics");
const accountDetailCategoriesEl = document.getElementById("accountDetailCategories");
const accountDetailTransactionsEl = document.getElementById("accountDetailTransactions");
const accountDetailCloseEl = document.getElementById("accountDetailClose");

const state = {
  month: "",
  accountId: "all",
  accounts: [],
  balances: [],
  transactions: [],
  summary: null,
  categories: null,
  trend: null,
};

function formatMonth(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatCurrency(cents, currency = "USD") {
  const amount = Number(cents) / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch (err) {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

function setStatus(connected) {
  if (!statusCardEl) {
    return;
  }
  statusCardEl.querySelector(".status-caption").textContent = connected
    ? "Local API connected"
    : "Local API unavailable";
  statusCardEl.querySelector(".status-dot").style.background = connected ? "#2f9e44" : "#e03131";
  statusCardEl.querySelector(".status-dot").style.boxShadow = connected
    ? "0 0 0 6px rgba(47, 158, 68, 0.18)"
    : "0 0 0 6px rgba(224, 49, 49, 0.18)";
}

function mapBalances(balances) {
  const map = new Map();
  balances.forEach((row) => {
    map.set(row.account_id, Number(row.balance_cents));
  });
  return map;
}

function buildSummaryCards(summary) {
  if (!summary) {
    summaryCardsEl.innerHTML = "<p class=\"empty\">No summary available.</p>";
    return;
  }
  const cards = [
    {
      label: "Income",
      value: formatCurrency(summary.income_cents),
      hint: "All income for the selected month",
    },
    {
      label: "Expenses",
      value: formatCurrency(summary.expense_cents),
      hint: "Spending across all accounts",
    },
    {
      label: "Net",
      value: formatCurrency(summary.net_cents),
      hint: "Income minus expenses",
    },
  ];

  summaryCardsEl.innerHTML = cards
    .map(
      (card) => `
        <article class="summary-card">
          <h3>${card.label}</h3>
          <p class="summary-value">${card.value}</p>
          <p class="summary-foot">${card.hint}</p>
        </article>
      `
    )
    .join("");
}

function buildAccountCards(accounts, balances, transactions) {
  if (!accounts.length) {
    accountsGridEl.innerHTML = "<p class=\"empty\">No accounts found.</p>";
    return;
  }

  const balancesMap = mapBalances(balances);
  const lastActivityMap = new Map();
  const monthlyTotalsMap = new Map();

  transactions.forEach((tx) => {
    const existing = lastActivityMap.get(tx.account_id);
    if (!existing || new Date(tx.spent_at) > new Date(existing)) {
      lastActivityMap.set(tx.account_id, tx.spent_at);
    }

    const totals = monthlyTotalsMap.get(tx.account_id) || { income: 0, expense: 0 };
    const amount = Number(tx.amount_cents);
    if (tx.kind === "income") {
      totals.income += amount;
    } else {
      totals.expense += amount;
    }
    monthlyTotalsMap.set(tx.account_id, totals);
  });

  accountsGridEl.innerHTML = accounts
    .map((account) => {
      const balance = balancesMap.get(account.id) || 0;
      const totals = monthlyTotalsMap.get(account.id) || { income: 0, expense: 0 };
      const lastActivity = lastActivityMap.get(account.id);
      return `
        <article class="account-card" data-account-id="${account.id}">
          <div class="account-meta">
            <span>${account.type.replace(/_/g, " ")}</span>
            <span>${account.currency}</span>
          </div>
          <h3>${account.name}</h3>
          <p class="account-balance">${formatCurrency(balance, account.currency)}</p>
          <div class="account-meta">
            <span>Income</span>
            <span>${formatCurrency(totals.income, account.currency)}</span>
          </div>
          <div class="account-meta">
            <span>Expenses</span>
            <span>${formatCurrency(totals.expense, account.currency)}</span>
          </div>
          <p class="account-activity">Last activity: ${formatDate(lastActivity)}</p>
        </article>
      `;
    })
    .join("");

  accountsGridEl.querySelectorAll(".account-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-account-id");
      if (id) {
        showAccountDetail(Number(id));
      }
    });
  });
}

function buildCategoryChart(data) {
  if (!data || !data.labels || !data.labels.length) {
    categoryChartEl.innerHTML = "<p class=\"empty\">No expense data for this month.</p>";
    return;
  }

  const max = Math.max(...data.values.map((value) => Number(value)));
  categoryChartEl.innerHTML = data.labels
    .map((label, index) => {
      const value = Number(data.values[index]);
      const width = max === 0 ? 0 : Math.round((value / max) * 100);
      return `
        <div class="bar-row">
          <span>${label}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${width}%"></div>
          </div>
          <strong>${formatCurrency(value)}</strong>
        </div>
      `;
    })
    .join("");
}

function buildTrendChart(data) {
  if (!data || !data.labels || !data.labels.length) {
    trendChartEl.innerHTML = "<p class=\"empty\">No trend data yet.</p>";
    return;
  }

  const maxValue = Math.max(
    ...data.income.map((value) => Number(value)),
    ...data.expense.map((value) => Number(value))
  );

  trendChartEl.innerHTML = data.labels
    .map((label, index) => {
      const income = Number(data.income[index]);
      const expense = Number(data.expense[index]);
      const incomeWidth = maxValue === 0 ? 0 : Math.round((income / maxValue) * 100);
      const expenseWidth = maxValue === 0 ? 0 : Math.round((expense / maxValue) * 100);
      return `
        <div class="trend-row">
          <span>${label}</span>
          <div class="trend-bars">
            <div class="trend-bar income"><span style="width:${incomeWidth}%"></span></div>
            <div class="trend-bar expense"><span style="width:${expenseWidth}%"></span></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function buildTransactionsTable(transactions) {
  if (!transactions.length) {
    transactionsTableEl.innerHTML = "<p class=\"empty\">No transactions for this month.</p>";
    return;
  }

  const rows = transactions.slice(0, 10);
  transactionsTableEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Account</th>
          <th>Category</th>
          <th>Type</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (tx) => `
            <tr>
              <td>${formatDate(tx.spent_at)}</td>
              <td>${tx.description || "-"}</td>
              <td>${tx.account_name || tx.account_id}</td>
              <td>${tx.category_name || "Uncategorized"}</td>
              <td><span class="badge">${tx.kind}</span></td>
              <td>${formatCurrency(tx.amount_cents)}</td>
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function buildDetailMetrics({ balance, income, expense, lastActivity, currency }) {
  const metrics = [
    { label: "Balance", value: formatCurrency(balance, currency) },
    { label: "Month income", value: formatCurrency(income, currency) },
    { label: "Month expenses", value: formatCurrency(expense, currency) },
    { label: "Last activity", value: formatDate(lastActivity) },
  ];

  accountDetailMetricsEl.innerHTML = metrics
    .map(
      (metric) => `
        <div class="detail-metric">
          <span>${metric.label}</span>
          <strong>${metric.value}</strong>
        </div>
      `
    )
    .join("");
}

function buildDetailCategories(transactions) {
  if (!transactions.length) {
    accountDetailCategoriesEl.innerHTML = "<p class=\"empty\">No category data.</p>";
    return;
  }
  const totals = new Map();
  transactions.forEach((tx) => {
    if (tx.kind !== "expense") {
      return;
    }
    const label = tx.category_name || "Uncategorized";
    totals.set(label, (totals.get(label) || 0) + Number(tx.amount_cents));
  });

  const rows = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!rows.length) {
    accountDetailCategoriesEl.innerHTML = "<p class=\"empty\">No expense categories.</p>";
    return;
  }

  accountDetailCategoriesEl.innerHTML = `
    <div class="detail-list">
      ${rows
        .map(
          ([label, value]) => `
          <div class="detail-row">
            <span>${label}</span>
            <strong>${formatCurrency(value)}</strong>
          </div>
        `
        )
        .join("")}
    </div>
  `;
}

function buildDetailTransactions(transactions, currency) {
  if (!transactions.length) {
    accountDetailTransactionsEl.innerHTML = "<p class=\"empty\">No transactions found.</p>";
    return;
  }

  const rows = transactions.slice(0, 6);
  accountDetailTransactionsEl.innerHTML = `
    <div class="detail-list">
      ${rows
        .map(
          (tx) => `
          <div class="detail-row">
            <span>${formatDate(tx.spent_at)} · ${tx.description || "-"}</span>
            <strong>${formatCurrency(tx.amount_cents, currency)}</strong>
          </div>
        `
        )
        .join("")}
    </div>
  `;
}

async function showAccountDetail(accountId) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account) {
    return;
  }

  const month = state.month;

  try {
    const transactionsRes = await fetchJson(
      `/api/transactions?month=${month}&account_id=${accountId}`
    );
    const transactions = transactionsRes.data || [];

    const balanceMap = mapBalances(state.balances);
    const balance = balanceMap.get(accountId) || 0;

    let income = 0;
    let expense = 0;
    let lastActivity = null;
    transactions.forEach((tx) => {
      if (tx.kind === "income") {
        income += Number(tx.amount_cents);
      } else {
        expense += Number(tx.amount_cents);
      }
      if (!lastActivity || new Date(tx.spent_at) > new Date(lastActivity)) {
        lastActivity = tx.spent_at;
      }
    });

    accountDetailNameEl.textContent = account.name;
    accountDetailMetaEl.textContent = `${account.type.replace(/_/g, " ")} · ${
      account.currency
    }`;

    buildDetailMetrics({
      balance,
      income,
      expense,
      lastActivity,
      currency: account.currency,
    });
    buildDetailCategories(transactions);
    buildDetailTransactions(transactions, account.currency);

    accountDetailEl.hidden = false;
    accountDetailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
  }
}

function updateAccountFilter(accounts) {
  const options = [
    '<option value="all">All accounts</option>',
    ...accounts.map((account) => `<option value="${account.id}">${account.name}</option>`),
  ];
  accountFilterEl.innerHTML = options.join("");
  accountFilterEl.value = state.accountId;
}

async function loadData() {
  const month = state.month;
  const accountFilter = state.accountId !== "all" ? `&account_id=${state.accountId}` : "";

  try {
    const [accountsRes, balancesRes, summaryRes, categoryRes, trendRes, transactionsRes] =
      await Promise.all([
        fetchJson("/api/accounts"),
        fetchJson("/api/reports/account-balances"),
        fetchJson(`/api/reports/summary?month=${month}`),
        fetchJson(`/api/reports/by-category?month=${month}`),
        fetchJson("/api/reports/monthly-trend?months=6"),
        fetchJson(`/api/transactions?month=${month}${accountFilter}`),
      ]);

    state.accounts = accountsRes.data || [];
    state.balances = balancesRes.data?.accounts || [];
    state.summary = summaryRes.data || null;
    state.categories = categoryRes.data || null;
    state.trend = trendRes.data || null;

    const transactions = (transactionsRes.data || []).map((tx) => ({
      ...tx,
      account_name: state.accounts.find((a) => a.id === tx.account_id)?.name,
    }));
    state.transactions = transactions;

    updateAccountFilter(state.accounts);
    buildSummaryCards(state.summary);
    buildAccountCards(state.accounts, state.balances, state.transactions);
    buildCategoryChart(state.categories);
    buildTrendChart(state.trend);
    buildTransactionsTable(state.transactions);
    setStatus(true);
  } catch (err) {
    console.error(err);
    setStatus(false);
    summaryCardsEl.innerHTML = "<p class=\"empty\">Unable to load data.</p>";
  }
}

function init() {
  const now = new Date();
  state.month = formatMonth(now);
  monthPickerEl.value = state.month;

  monthPickerEl.addEventListener("change", () => {
    state.month = monthPickerEl.value || formatMonth(new Date());
    loadData();
  });

  accountFilterEl.addEventListener("change", () => {
    state.accountId = accountFilterEl.value;
    loadData();
  });

  refreshButtonEl.addEventListener("click", () => loadData());
  accountDetailCloseEl.addEventListener("click", () => {
    accountDetailEl.hidden = true;
  });

  loadData();
}

init();
