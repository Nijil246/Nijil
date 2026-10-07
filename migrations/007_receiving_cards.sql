CREATE TABLE IF NOT EXISTS virtual_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider text NOT NULL DEFAULT 'pending_issuer',
  status text NOT NULL DEFAULT 'ISSUER_REQUIRED',
  card_brand text,
  last4 text,
  currency text NOT NULL DEFAULT 'USDT',
  created_at timestamptz NOT NULL DEFAULT now()
);