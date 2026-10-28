CREATE TABLE IF NOT EXISTS bill_payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  bill_type text NOT NULL,
  provider_name text NOT NULL,
  customer_reference text NOT NULL,
  amount_inr numeric(12,2) NOT NULL CHECK (amount_inr > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('INR','USDT')),
  status text NOT NULL DEFAULT 'PROVIDER_REQUIRED',
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bill_payment_requests_user_created_idx ON bill_payment_requests(user_id, created_at DESC);