CREATE TABLE usdt_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT current_setting('hatchable.user_id', true),
  account_holder text NOT NULL,
  bank_name text NOT NULL,
  account_last4 text NOT NULL,
  ifsc text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX usdt_bank_accounts_user_id_idx ON usdt_bank_accounts(user_id);
CREATE TABLE usdt_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT current_setting('hatchable.user_id', true),
  bank_account_id uuid NOT NULL,
  amount_usdt numeric NOT NULL,
  rate_inr numeric NOT NULL,
  gross_inr numeric NOT NULL,
  fee_inr numeric NOT NULL DEFAULT 0,
  net_inr numeric NOT NULL,
  status text NOT NULL DEFAULT 'PENDING_PROVIDER',
  provider_reference text,
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX usdt_withdrawals_user_id_idx ON usdt_withdrawals(user_id);