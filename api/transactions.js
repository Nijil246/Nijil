import { db } from "hatchable";

export const access = "user";

export default async function(req, res) {
  const { rows } = await db.query(
    "SELECT id, type, amount_paise, counterparty, note, status, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30",
    [req.user.id]
  );
  res.json(rows);
}