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

API:
- `GET /health`
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/transactions`
- `POST /api/transactions`

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

## Local run (no Docker)

```bash
npm install
npm run dev
```

Ensure Postgres is running and env vars match `.env.example`.
