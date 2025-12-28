ALTER TABLE recurring_incomes
ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP;
