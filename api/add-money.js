import { db } from "hatchable";

export const access = "user";
export const methods = ["POST"];

export default async function(req,res){
  const paise=Math.round(Number(req.body?.amount)*100);
  if(!Number.isFinite(paise)||paise<100) return res.status(400).json({error:"Minimum add-money amount is ₹1."});
  await db.query("UPDATE wallets SET balance_paise = balance_paise + $1 WHERE user_id = $2",[paise,req.user.id]);
  await db.query("INSERT INTO transactions (user_id,type,amount_paise,counterparty,note,status) VALUES ($1,'ADD_MONEY',$2,'UPI Pay','Wallet top-up','SUCCESS')",[req.user.id,paise]);
  res.json({ok:true});
}