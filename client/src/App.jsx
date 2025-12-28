import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { deleteJson, getJson, patchJson, postJson } from "./api.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const ACCOUNT_TYPES = [
  "bank",
  "credit_card",
  "wallet",
  "cash",
  "investment",
  "loan",
  "other",
];

const CADENCES = ["weekly", "biweekly", "monthly"];

function formatMonth(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatCurrency(cents, currency = "USD") {
  const amount = Number(cents || 0) / 100;
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

function initialForm() {
  return {
    transaction: {
      account_id: "",
      user_id: "",
      category_id: "",
      kind: "expense",
      amount_cents: "",
      description: "",
      spent_at: "",
    },
    account: {
      name: "",
      type: "bank",
      currency: "USD",
      created_by_user_id: "",
      member_ids: [],
    },
    category: {
      name: "",
      group_name: "",
      color: "",
    },
    user: {
      name: "",
      email: "",
      password: "",
      role: "member",
    },
    recurring: {
      account_id: "",
      user_id: "",
      category_id: "",
      cadence: "monthly",
      amount_cents: "",
      description: "",
      start_date: "",
    },
  };
}

export default function App() {
  const [month, setMonth] = useState(formatMonth(new Date()));
  const [accountFilter, setAccountFilter] = useState("all");
  const [data, setData] = useState({
    accounts: [],
    balances: [],
    summary: null,
    categories: [],
    categoryChart: null,
    trend: null,
    transactions: [],
    users: [],
    recurring: [],
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("transaction");
  const [form, setForm] = useState(initialForm());
  const [modalError, setModalError] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  const filtersLabel = useMemo(() => {
    const selected = data.accounts.find((item) => String(item.id) === accountFilter);
    return selected ? selected.name : "All accounts";
  }, [accountFilter, data.accounts]);

  async function loadData() {
    setLoading(true);
    try {
      const accountParam = accountFilter === "all" ? "" : `&account_id=${accountFilter}`;
      const [
        accountsRes,
        balancesRes,
        summaryRes,
        categoryRes,
        trendRes,
        transactionsRes,
        categoriesRes,
        usersRes,
        recurringRes,
      ] = await Promise.all([
        getJson("/api/accounts"),
        getJson("/api/reports/account-balances"),
        getJson(`/api/reports/summary?month=${month}`),
        getJson(`/api/reports/by-category?month=${month}`),
        getJson("/api/reports/monthly-trend?months=6"),
        getJson(`/api/transactions?month=${month}${accountParam}`),
        getJson("/api/categories"),
        getJson("/api/users"),
        getJson("/api/recurring-incomes"),
      ]);

      setData({
        accounts: accountsRes.data || [],
        balances: balancesRes.data?.accounts || [],
        summary: summaryRes.data || null,
        categoryChart: categoryRes.data || null,
        trend: trendRes.data || null,
        transactions: transactionsRes.data || [],
        categories: categoriesRes.data || [],
        users: usersRes.data || [],
        recurring: recurringRes.data || [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch((err) => console.error(err));
  }, [month, accountFilter]);

  function openModal(tab = "transaction") {
    setModalTab(tab);
    setModalOpen(true);
    setModalError("");
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setModalError("");
  }

  function updateForm(section, field, value) {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  }

  async function handleCreate(section) {
    setModalError("");
    try {
      if (section === "transaction") {
        const payload = {
          ...form.transaction,
          amount_cents: Number(form.transaction.amount_cents),
          account_id: Number(form.transaction.account_id),
          user_id: Number(form.transaction.user_id),
          category_id: form.transaction.category_id
            ? Number(form.transaction.category_id)
            : undefined,
          spent_at: form.transaction.spent_at
            ? new Date(form.transaction.spent_at).toISOString()
            : undefined,
        };
        await postJson("/api/transactions", payload);
      }
      if (section === "account") {
        const payload = {
          ...form.account,
          created_by_user_id: Number(form.account.created_by_user_id),
          member_ids: form.account.member_ids.map((value) => Number(value)),
        };
        await postJson("/api/accounts", payload);
      }
      if (section === "category") {
        await postJson("/api/categories", form.category);
      }
      if (section === "user") {
        await postJson("/api/users", form.user);
      }
      if (section === "recurring") {
        const payload = {
          ...form.recurring,
          amount_cents: Number(form.recurring.amount_cents),
          account_id: Number(form.recurring.account_id),
          user_id: Number(form.recurring.user_id),
          category_id: form.recurring.category_id
            ? Number(form.recurring.category_id)
            : undefined,
        };
        await postJson("/api/recurring-incomes", payload);
      }

      setForm(initialForm());
      await loadData();
      closeModal();
    } catch (err) {
      setModalError(err.message || "Unable to save.");
    }
  }

  async function handleDelete(entity, id) {
    const confirmText = `Delete this ${entity}?`;
    if (!window.confirm(confirmText)) {
      return;
    }
    if (entity === "account") {
      await deleteJson(`/api/accounts/${id}`);
    }
    if (entity === "category") {
      await deleteJson(`/api/categories/${id}`);
    }
    if (entity === "recurring") {
      await deleteJson(`/api/recurring-incomes/${id}`);
    }
    await loadData();
  }

  async function handleEditSubmit() {
    if (!editTarget) {
      return;
    }
    const { type, payload, id } = editTarget;
    if (type === "account") {
      await patchJson(`/api/accounts/${id}`, payload);
    }
    if (type === "category") {
      await patchJson(`/api/categories/${id}`, payload);
    }
    if (type === "recurring") {
      await patchJson(`/api/recurring-incomes/${id}`, {
        ...payload,
        amount_cents: Number(payload.amount_cents),
      });
    }
    setEditTarget(null);
    await loadData();
  }

  const categoryChartData = useMemo(() => {
    if (!data.categoryChart) return null;
    return {
      labels: data.categoryChart.labels,
      datasets: [
        {
          data: data.categoryChart.values,
          backgroundColor: ["#1f6f78", "#d49f3a", "#506a7a", "#c36c50", "#7d9d8d", "#b0796d"],
        },
      ],
    };
  }, [data.categoryChart]);

  const trendData = useMemo(() => {
    if (!data.trend) return null;
    return {
      labels: data.trend.labels,
      datasets: [
        {
          label: "Income",
          data: data.trend.income,
          borderColor: "#1f6f78",
          backgroundColor: "rgba(31, 111, 120, 0.2)",
          tension: 0.3,
        },
        {
          label: "Expenses",
          data: data.trend.expense,
          borderColor: "#c85c4d",
          backgroundColor: "rgba(200, 92, 77, 0.2)",
          tension: 0.3,
        },
      ],
    };
  }, [data.trend]);

  const accountBalances = useMemo(() => {
    const map = new Map();
    data.balances.forEach((row) => map.set(row.account_id, row.balance_cents));
    return map;
  }, [data.balances]);

  return (
    <div className="app">
      <aside>
        <div className="brand">Home Financial</div>
        <div className="nav">
          <span>Overview</span>
          <button type="button">Dashboard</button>
          <button type="button">Accounts</button>
          <button type="button">Reports</button>
          <button type="button">Settings</button>
        </div>
        <div>
          <span className="pill">{loading ? "Syncing" : "Live"}</span>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <div className="headline">
            <h1>Household Ledger</h1>
            <p>Balances, insights, and recurring cash flow in one view.</p>
          </div>
          <div className="filters">
            <label>
              Month
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
            <label>
              Account
              <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
                <option value="all">All accounts</option>
                {data.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Actions
              <button type="button" onClick={() => openModal("transaction")}>
                Add data
              </button>
            </label>
          </div>
        </div>

        <div className="grid">
          <div className="card summary">
            <span>Income</span>
            <strong>{formatCurrency(data.summary?.income_cents || 0)}</strong>
            <p>{filtersLabel}</p>
          </div>
          <div className="card summary">
            <span>Expenses</span>
            <strong>{formatCurrency(data.summary?.expense_cents || 0)}</strong>
            <p>{filtersLabel}</p>
          </div>
          <div className="card summary">
            <span>Net</span>
            <strong>{formatCurrency(data.summary?.net_cents || 0)}</strong>
            <p>Current month</p>
          </div>

          <div className="card chart-card">
            <div className="section-title">
              <div>
                <h2>Category split</h2>
                <p>Expense distribution for {month}</p>
              </div>
            </div>
            {categoryChartData ? <Doughnut data={categoryChartData} /> : <p>No data.</p>}
          </div>

          <div className="card chart-card">
            <div className="section-title">
              <div>
                <h2>Income vs expenses</h2>
                <p>Trailing 6 months</p>
              </div>
            </div>
            {trendData ? (
              <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <p>No data.</p>
            )}
          </div>

          <div className="card" style={{ gridColumn: "span 6" }}>
            <div className="section-title">
              <div>
                <h2>Accounts</h2>
                <p>Balances and cash flow this month.</p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => openModal("account")}>
                New account
              </button>
            </div>
            <div className="list">
              {data.accounts.map((account) => {
                const balance = accountBalances.get(account.id) || 0;
                return (
                  <div key={account.id} className="list-item">
                    <div className="list-row">
                      <div>
                        <strong>{account.name}</strong>
                        <div className="pill">{account.type.replace(/_/g, " ")}</div>
                      </div>
                      <strong>{formatCurrency(balance, account.currency)}</strong>
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        onClick={() =>
                          setEditTarget({
                            type: "account",
                            id: account.id,
                            payload: {
                              name: account.name,
                              type: account.type,
                              currency: account.currency,
                            },
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete("account", account.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ gridColumn: "span 6" }}>
            <div className="section-title">
              <div>
                <h2>Recurring income</h2>
                <p>Upcoming scheduled inflows.</p>
              </div>
              <div className="actions">
                <button
                  type="button"
                  onClick={async () => {
                    await postJson("/api/recurring-incomes/run", {});
                    await loadData();
                  }}
                >
                  Run now
                </button>
                <button type="button" onClick={() => openModal("recurring")}>
                  Add recurring
                </button>
              </div>
            </div>
            <div className="list">
              {data.recurring.map((item) => (
                <div key={item.id} className="list-item">
                  <div className="list-row">
                    <span>
                      {item.description || item.account_name} · {item.cadence}
                    </span>
                    <strong>{formatCurrency(item.amount_cents)}</strong>
                  </div>
                  <div className="list-row">
                    <span>Next: {formatDate(item.next_run_at)}</span>
                    <span>Last: {item.last_run_at ? formatDate(item.last_run_at) : "—"}</span>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      onClick={() =>
                        setEditTarget({
                          type: "recurring",
                          id: item.id,
                          payload: {
                            amount_cents: item.amount_cents,
                            cadence: item.cadence,
                            description: item.description || "",
                          },
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete("recurring", item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ gridColumn: "span 4" }}>
            <div className="section-title">
              <div>
                <h2>Categories</h2>
                <p>Editing labels and groupings.</p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => openModal("category")}>
                New category
              </button>
            </div>
            <div className="list">
              {data.categories.map((category) => (
                <div key={category.id} className="list-item">
                  <div className="list-row">
                    <span>{category.name}</span>
                    <span>{category.group_name || "—"}</span>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      onClick={() =>
                        setEditTarget({
                          type: "category",
                          id: category.id,
                          payload: {
                            name: category.name,
                            group_name: category.group_name || "",
                            color: category.color || "",
                          },
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete("category", category.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ gridColumn: "span 8" }}>
            <div className="section-title">
              <div>
                <h2>Recent activity</h2>
                <p>Latest transactions for {month}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Category</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.slice(0, 12).map((tx) => (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.spent_at)}</td>
                    <td>{tx.description || "—"}</td>
                    <td>{tx.account_name}</td>
                    <td>{tx.category_name || "Uncategorized"}</td>
                    <td>{tx.user_name}</td>
                    <td>
                      <span className="badge">{tx.kind}</span>
                    </td>
                    <td>{formatCurrency(tx.amount_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Quick add</h2>
                <p>Create transactions, accounts, or recurring income.</p>
              </div>
              <button type="button" className="btn-ghost" onClick={closeModal}>
                Close
              </button>
            </div>
            {modalError && <div className="error">{modalError}</div>}
            <div className="modal-tabs">
              {["transaction", "account", "category", "user", "recurring"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={tab === modalTab ? "active" : ""}
                  onClick={() => setModalTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="form-grid">
              {modalTab === "transaction" && (
                <>
                  <label>
                    Account
                    <select
                      value={form.transaction.account_id}
                      onChange={(e) => updateForm("transaction", "account_id", e.target.value)}
                    >
                      <option value="">Select account</option>
                      {data.accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    User
                    <select
                      value={form.transaction.user_id}
                      onChange={(e) => updateForm("transaction", "user_id", e.target.value)}
                    >
                      <option value="">Select user</option>
                      {data.users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      value={form.transaction.category_id}
                      onChange={(e) => updateForm("transaction", "category_id", e.target.value)}
                    >
                      <option value="">Uncategorized</option>
                      {data.categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Type
                    <select
                      value={form.transaction.kind}
                      onChange={(e) => updateForm("transaction", "kind", e.target.value)}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </label>
                  <label>
                    Amount (cents)
                    <input
                      type="number"
                      min="0"
                      value={form.transaction.amount_cents}
                      onChange={(e) => updateForm("transaction", "amount_cents", e.target.value)}
                    />
                  </label>
                  <label>
                    Description
                    <input
                      type="text"
                      value={form.transaction.description}
                      onChange={(e) => updateForm("transaction", "description", e.target.value)}
                    />
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      value={form.transaction.spent_at}
                      onChange={(e) => updateForm("transaction", "spent_at", e.target.value)}
                    />
                  </label>
                  <div className="form-actions">
                    <button className="btn-primary" type="button" onClick={() => handleCreate("transaction")}>
                      Save transaction
                    </button>
                  </div>
                </>
              )}
              {modalTab === "account" && (
                <>
                  <label>
                    Name
                    <input
                      type="text"
                      value={form.account.name}
                      onChange={(e) => updateForm("account", "name", e.target.value)}
                    />
                  </label>
                  <label>
                    Type
                    <select
                      value={form.account.type}
                      onChange={(e) => updateForm("account", "type", e.target.value)}
                    >
                      {ACCOUNT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Currency
                    <input
                      type="text"
                      value={form.account.currency}
                      onChange={(e) => updateForm("account", "currency", e.target.value)}
                    />
                  </label>
                  <label>
                    Owner
                    <select
                      value={form.account.created_by_user_id}
                      onChange={(e) => updateForm("account", "created_by_user_id", e.target.value)}
                    >
                      <option value="">Select owner</option>
                      {data.users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Members
                    <select
                      multiple
                      value={form.account.member_ids}
                      onChange={(e) =>
                        updateForm(
                          "account",
                          "member_ids",
                          Array.from(e.target.selectedOptions).map((opt) => opt.value)
                        )
                      }
                    >
                      {data.users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="form-actions">
                    <button className="btn-primary" type="button" onClick={() => handleCreate("account")}>
                      Save account
                    </button>
                  </div>
                </>
              )}
              {modalTab === "category" && (
                <>
                  <label>
                    Name
                    <input
                      type="text"
                      value={form.category.name}
                      onChange={(e) => updateForm("category", "name", e.target.value)}
                    />
                  </label>
                  <label>
                    Group
                    <input
                      type="text"
                      value={form.category.group_name}
                      onChange={(e) => updateForm("category", "group_name", e.target.value)}
                    />
                  </label>
                  <label>
                    Color
                    <input
                      type="text"
                      value={form.category.color}
                      onChange={(e) => updateForm("category", "color", e.target.value)}
                    />
                  </label>
                  <div className="form-actions">
                    <button className="btn-primary" type="button" onClick={() => handleCreate("category")}>
                      Save category
                    </button>
                  </div>
                </>
              )}
              {modalTab === "user" && (
                <>
                  <label>
                    Name
                    <input
                      type="text"
                      value={form.user.name}
                      onChange={(e) => updateForm("user", "name", e.target.value)}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={form.user.email}
                      onChange={(e) => updateForm("user", "email", e.target.value)}
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={form.user.password}
                      onChange={(e) => updateForm("user", "password", e.target.value)}
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={form.user.role}
                      onChange={(e) => updateForm("user", "role", e.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <div className="form-actions">
                    <button className="btn-primary" type="button" onClick={() => handleCreate("user")}>
                      Save user
                    </button>
                  </div>
                </>
              )}
              {modalTab === "recurring" && (
                <>
                  <label>
                    Account
                    <select
                      value={form.recurring.account_id}
                      onChange={(e) => updateForm("recurring", "account_id", e.target.value)}
                    >
                      <option value="">Select account</option>
                      {data.accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    User
                    <select
                      value={form.recurring.user_id}
                      onChange={(e) => updateForm("recurring", "user_id", e.target.value)}
                    >
                      <option value="">Select user</option>
                      {data.users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      value={form.recurring.category_id}
                      onChange={(e) => updateForm("recurring", "category_id", e.target.value)}
                    >
                      <option value="">Uncategorized</option>
                      {data.categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Cadence
                    <select
                      value={form.recurring.cadence}
                      onChange={(e) => updateForm("recurring", "cadence", e.target.value)}
                    >
                      {CADENCES.map((cadence) => (
                        <option key={cadence} value={cadence}>
                          {cadence}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Amount (cents)
                    <input
                      type="number"
                      min="0"
                      value={form.recurring.amount_cents}
                      onChange={(e) => updateForm("recurring", "amount_cents", e.target.value)}
                    />
                  </label>
                  <label>
                    Description
                    <input
                      type="text"
                      value={form.recurring.description}
                      onChange={(e) => updateForm("recurring", "description", e.target.value)}
                    />
                  </label>
                  <label>
                    Start date
                    <input
                      type="date"
                      value={form.recurring.start_date}
                      onChange={(e) => updateForm("recurring", "start_date", e.target.value)}
                    />
                  </label>
                  <div className="form-actions">
                    <button className="btn-primary" type="button" onClick={() => handleCreate("recurring")}>
                      Save recurring income
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="modal" onClick={() => setEditTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit {editTarget.type}</h2>
                <p>Update and save your changes.</p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => setEditTarget(null)}>
                Close
              </button>
            </div>
            <div className="form-grid">
              {editTarget.type === "account" && (
                <>
                  <label>
                    Name
                    <input
                      type="text"
                      value={editTarget.payload.name}
                      onChange={(e) =>
                        setEditTarget((prev) => ({
                          ...prev,
                          payload: { ...prev.payload, name: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Type
                    <select
                      value={editTarget.payload.type}
                      onChange={(e) =>
                        setEditTarget((prev) => ({
                          ...prev,
                          payload: { ...prev.payload, type: e.target.value },
                        }))
                      }
                    >
                      {ACCOUNT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Currency
                    <input
                      type="text"
                      value={editTarget.payload.currency}
                      onChange={(e) =>
                        setEditTarget((prev) => ({
                          ...prev,
                          payload: { ...prev.payload, currency: e.target.value },
                        }))
                      }
                    />
                  </label>
                </>
              )}
              {editTarget.type === "category" && (
                <>
                  <label>
                    Name
                    <input
                      type="text"
                      value={editTarget.payload.name}
                      onChange={(e) =>
                        setEditTarget((prev) => ({
                          ...prev,
                          payload: { ...prev.payload, name: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Group
                    <input
                      type="text"
                      value={editTarget.payload.group_name}
                      onChange={(e) =>
                        setEditTarget((prev) => ({
                          ...prev,
                          payload: { ...prev.payload, group_name: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Color
                    <input
                      type="text"
                      value={editTarget.payload.color}
                      onChange={(e) =>
                        setEditTarget((prev) => ({
                          ...prev,
                          payload: { ...prev.payload, color: e.target.value },
                        }))
                      }
                    />
                  </label>
                </>
              )}
              {editTarget.type === "recurring" && (
                <>
                  <label>
                    Amount (cents)
                    <input
                      type="number"
                      min="0"
                      value={editTarget.payload.amount_cents}
                      onChange={(e) =>
                        setEditTarget((prev) => ({
                          ...prev,
                          payload: { ...prev.payload, amount_cents: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Cadence
                    <select
                      value={editTarget.payload.cadence}
                      onChange={(e) =>
                        setEditTarget((prev) => ({
                          ...prev,
                          payload: { ...prev.payload, cadence: e.target.value },
                        }))
                      }
                    >
                      {CADENCES.map((cadence) => (
                        <option key={cadence} value={cadence}>
                          {cadence}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Description
                    <input
                      type="text"
                      value={editTarget.payload.description}
                      onChange={(e) =>
                        setEditTarget((prev) => ({
                          ...prev,
                          payload: { ...prev.payload, description: e.target.value },
                        }))
                      }
                    />
                  </label>
                </>
              )}
              <div className="form-actions">
                <button className="btn-ghost" type="button" onClick={() => setEditTarget(null)}>
                  Cancel
                </button>
                <button className="btn-primary" type="button" onClick={handleEditSubmit}>
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
