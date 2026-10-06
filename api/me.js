import { db, auth } from "hatchable";

export const access = "user";

export default async function(req, res) {
  const user = req.user;
  await db.query(
    "INSERT INTO wallets (user_id, upi_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = $1)",
    [user.id, (user.email || "user").split("@")[0].replace(/[^a-zA-Z0-9]/g,"").toLowerCase() + "@upipay"]
  );
  const { rows } = await db.query("SELECT balance_paise, upi_id FROM wallets WHERE user_id = $1", [user.id]);
  res.json({ user, wallet: rows[0] });
}