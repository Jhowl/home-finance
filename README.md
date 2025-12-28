# Home Financial (local network)

Minimal Node.js + Postgres API for home finance tracking, designed for Docker on a home network.

## Structure (clean architecture inspired)
- `src/controllers` -> HTTP handlers
- `src/services` -> business rules and validation
- `src/repositories` -> database access
- `src/routes` -> Express routes
- `src/config` -> infrastructure setup (DB)
- `src/middlewares` -> shared middleware
- `src/db` -> database init scripts

## Run with Docker

```bash
docker compose up --build
```

API + UI:
- `GET /health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users`
- `POST /api/users`
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/recurring-incomes`
- `POST /api/recurring-incomes`
- `POST /api/recurring-incomes/run`
- `GET /api/reports/summary`
- `GET /api/reports/by-category`
- `GET /api/reports/by-account`
- `GET /api/reports/monthly-trend`
- `GET /api/reports/account-balances`

UI:
- `GET /` (dashboard)

Demo:
- `docs/demo.md`
- `scripts/demo.sh`

Migrations:
- `docs/migrations/2025-02-18-add-recurring-last-run.sql`

Example transaction payload:

```json
{
  "account_id": 1,
  "user_id": 1,
  "category_id": 2,
  "amount_cents": 1200,
  "kind": "expense",
  "description": "weekend market",
  "spent_at": "2024-01-15T12:00:00Z"
}
```

Auth:
- Login returns a bearer token. Send it as `Authorization: Bearer <token>` to `/api/auth/me` and `/api/auth/logout`.
- Optional seed admin user: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars.
- Optional demo seed data: set `SEED_DEMO=true` (default password `demo123`, override with `DEMO_PASSWORD`).
Recurring incomes:
- Auto-runner is enabled by default; change with `ENABLE_RECURRING_RUNNER=false`.
- Interval (minutes): `RECURRING_RUNNER_INTERVAL_MINUTES` (default 60, minimum 5).

Reports:
- `GET /api/reports/summary?month=2025-02` -> `{ income_cents, expense_cents, net_cents }`
- `GET /api/reports/by-category?month=2025-02` -> `{ labels: [...], values: [...] }`
- `GET /api/reports/by-account?month=2025-02` -> `{ labels: [...], values: [...] }`
- `GET /api/reports/monthly-trend?months=12` -> `{ labels: [...], income: [...], expense: [...] }`
- `GET /api/reports/account-balances` -> `{ accounts: [{ account_id, account_name, balance_cents }] }`

## Local run (no Docker)

```bash
npm install
npm run dev
```

Ensure Postgres is running and env vars match `.env.example`.
