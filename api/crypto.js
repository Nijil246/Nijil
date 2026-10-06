import { db } from "hatchable";

export const access = "user";

export default async function(req,res){
  const u=req.user;
  const address="T"+String(u.id).replace(/[^a-zA-Z0-9]/g,"").slice(0,33).padEnd(33,"0");
  await db.query("INSERT INTO crypto_wallets (user_id,network,address) SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT 1 FROM crypto_wallets WHERE user_id=$1)",[u.id,"TRC20",address]);
  const {rows}=await db.query("SELECT network,address,balance_usdt FROM crypto_wallets WHERE user_id=$1",[u.id]);
  const {rows:tx}=await db.query("SELECT id,type,amount_usdt,network,counterparty,tx_hash,status,created_at FROM crypto_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30",[u.id]);
  res.json({wallet:rows[0],transactions:tx});
}