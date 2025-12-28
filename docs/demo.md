# Demo Walkthrough

This demo uses the built-in seed data so you can verify the UI and reports quickly.

## 1) Start with demo seed data

Set the following env vars before running:

```
SEED_DEMO=true
DEMO_PASSWORD=demo123
```

Then run:

```
docker compose up --build
```

Open the dashboard at:
```
http://localhost:3000
```

Demo users:
- alex@home.local / demo123
- jamie@home.local / demo123

## 2) Quick API checks (optional)

Summary:
```
curl "http://localhost:3000/api/reports/summary?month=$(date +%Y-%m)"
```

Category breakdown:
```
curl "http://localhost:3000/api/reports/by-category?month=$(date +%Y-%m)"
```

Account balances:
```
curl "http://localhost:3000/api/reports/account-balances"
```

Recent transactions:
```
curl "http://localhost:3000/api/transactions?month=$(date +%Y-%m)"
```
