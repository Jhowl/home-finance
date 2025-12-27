# Implementation Plan: Self-Hosted Expense Tracker

This document turns the high-level idea into a concrete build plan tailored to this repo (Node.js API + Postgres + Docker).
It focuses on an MVP that supports multiple household members, shared accounts, and a desktop-first dashboard.

## 1) Scope and decisions

- Desktop-first web app on a local network only.
- Stack: Node.js (Express), PostgreSQL, frontend SPA (React).
- Multi-user: authentication required; all users can view all data; transactions are tagged by user.
- Shared accounts: supported with an account_members join table.

## 2) Architecture overview

- Postgres for persistence and reporting queries.
- REST API for CRUD and reporting.
- Frontend SPA for dashboard, filters, and charts.
- Docker Compose for local deployment (already present).

## 3) Data model (ERD)

```
users
  id PK
  name
  email (unique)
  password_hash
  role
  created_at

accounts
  id PK
  name
  type (bank | credit_card | wallet | cash | investment | loan | other)
  currency
  created_by_user_id FK -> users.id
  created_at

account_members
  account_id FK -> accounts.id
  user_id FK -> users.id
  role
  PK(account_id, user_id)

categories
  id PK
  name
  group_name
  color
  created_at

transactions
  id PK
  account_id FK -> accounts.id
  user_id FK -> users.id
  category_id FK -> categories.id
  amount_cents
  kind (expense | income)
  description
  spent_at
  created_at
```

## 4) PostgreSQL schema (DDL)

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type VARCHAR(64) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_by_user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_members (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'member',
  PRIMARY KEY (account_id, user_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  group_name VARCHAR(120),
  color VARCHAR(32),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  kind VARCHAR(16) NOT NULL CHECK (kind IN ('expense', 'income')),
  description TEXT,
  spent_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_spent_at ON transactions (spent_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
```

## 5) REST API contract

### Auth
- `POST /api/auth/login`
  - body: `{ "email": "a@b.com", "password": "secret" }`
  - response: `{ "user": { "id": 1, "name": "Alex", "role": "member" } }`
- `POST /api/auth/logout`
- `GET /api/auth/me`
  - response: `{ "user": { "id": 1, "name": "Alex", "role": "member" } }`

### Users (admin)
- `GET /api/users`
- `POST /api/users`
  - body: `{ "name": "Sam", "email": "sam@home", "password": "secret", "role": "member" }`

### Accounts
- `GET /api/accounts`
- `POST /api/accounts`
  - body: `{ "name": "Checking", "type": "bank", "currency": "USD", "member_ids": [1,2] }`
- `PATCH /api/accounts/:id`

### Categories
- `GET /api/categories`
- `POST /api/categories`

### Transactions
- `GET /api/transactions?month=2025-02&account_id=1&user_id=2`
- `POST /api/transactions`
  - body: `{ "account_id": 1, "user_id": 2, "category_id": 5, "amount_cents": 1200, "kind": "expense", "description": "groceries", "spent_at": "2025-02-18T18:30:00Z" }`
- `PATCH /api/transactions/:id`

### Reports
- `GET /api/reports/summary?month=2025-02`
  - response: `{ "income_cents": 500000, "expense_cents": 320000, "net_cents": 180000 }`
- `GET /api/reports/by-category?month=2025-02`
  - response: `{ "labels": ["Groceries", "Rent"], "values": [120000, 180000] }`
- `GET /api/reports/by-account?month=2025-02`
- `GET /api/reports/monthly-trend?months=12`

## 6) Frontend dashboard layout

- Stack choice: React + Vite, Chart.js via `react-chartjs-2`, CSS Modules (or Tailwind if preferred).
- Layout:
  - Left sidebar navigation: Dashboard, Accounts, Transactions, Categories, Reports, Admin.
  - Top bar: current month selector, account filter, user filter, quick add button.
  - Main dashboard grid: summary cards, charts, recent transactions.
- Dashboard content:
  - Summary cards: income, expenses, net.
  - Pie chart: spend by category (click legend to toggle categories).
  - Bar chart: monthly trend (last 12 months).
  - Recent transactions table (last 10), with "view all" link.
- Accounts page:
  - Account list grouped by type: Bank, Credit Card, Wallet, Cash, Investment, Loan, Other.
  - Each account shows balance, members, and last transaction date.
- Transactions page:
  - Table with filters (date range, account, user, category, kind).
  - Inline add/edit drawer to log a new transaction quickly.

## 7) Docker deployment

Current `docker-compose.yml` is good for local use.
For a production home server setup:
- Move secrets to `.env`.
- Add a backup job (cron) that runs `pg_dump`.
- Optionally add a frontend container if you separate the SPA build from the API.

## 8) Milestones

1. Expand DB schema + migrations.
2. Auth and users.
3. Accounts + categories CRUD.
4. Transactions CRUD.
5. Report endpoints (SQL aggregations).
6. Dashboard frontend + charts.
7. Docker hardening + backups.

## 9) Open questions to finalize

- Shared visibility rules (all-users see all, or account-based access).
- Currency handling (single currency vs per account).
