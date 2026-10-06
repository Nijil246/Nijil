CREATE TABLE IF NOT EXISTS crypto_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount_usdt NUMERIC(24,6) NOT NULL,
  network TEXT NOT NULL,
  counterparty TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)