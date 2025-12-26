CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  category VARCHAR(64) NOT NULL,
  note TEXT,
  spent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON expenses (spent_at DESC);
