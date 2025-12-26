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
- `GET /expenses`
- `POST /expenses`

Example payload:

```json
{
  "amount_cents": 1200,
  "category": "groceries",
  "note": "weekend market",
  "spent_at": "2024-01-15T12:00:00Z"
}
```

## Local run (no Docker)

```bash
npm install
npm run dev
```

Ensure Postgres is running and env vars match `.env.example`.
