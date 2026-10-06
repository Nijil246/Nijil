import { db } from "hatchable";

export const access = "user";
export const methods = ["POST"];

export default async function(req, res) {
  const { amount, counterparty, note } = req.body || {};
  const paise = Math.round(Number(amount) * 100);
  if (!Number.isFinite(paise) || paise <= 0 || !counterparty) return res.status(400).json({error:"Enter a valid amount and UPI ID."});

  const result = await db.transaction([
    {sql:"INSERT INTO wallets (user_id, upi_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = $1)",params:[req.user.id,"user@upipay"]},
    {sql:"UPDATE wallets SET balance_paise = balance_paise - $1 WHERE user_id = $2 AND balance_paise >= $1",params:[paise,req.user.id]},
    {sql:"INSERT INTO transactions (user_id,type,amount_paise,counterparty,note,status) SELECT $1,'PAYMENT',$2,$3,$4,'SUCCESS' WHERE EXISTS (SELECT 1 FROM wallets WHERE user_id=$1 AND balance_paise >= 0)",params:[req.user.id,paise,counterparty,note||"UPI payment"]}
  ]);
  const updated = result.results?.[1]?.rowCount ?? 0;
  if (!updated) return res.status(400).json({error:"Insufficient wallet balance. Add money to continue."});
  res.json({ok:true});
}