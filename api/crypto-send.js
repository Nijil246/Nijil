import { db } from "hatchable";

export const access = "user";
export const methods = ["POST"];

export default async function(req,res){
  const {amount,address,network}=req.body||{};
  const n=network||"TRC20";
  const a=Number(amount);
  if(!Number.isFinite(a)||a<=0||!address) return res.status(400).json({error:"Enter a valid USDT amount and wallet address."});
  const r=await db.query("UPDATE crypto_wallets SET balance_usdt=balance_usdt-$1 WHERE user_id=$2 AND network=$3 AND balance_usdt >= $1",[a,req.user.id,n]);
  if(!r.rowCount) return res.status(400).json({error:"Insufficient USDT balance."});
  await db.query("INSERT INTO crypto_transactions (user_id,type,amount_usdt,network,counterparty,status) VALUES ($1,'SEND',$2,$3,$4,'PENDING')",[req.user.id,a,n,address]);
  res.json({ok:true,status:"PENDING",message:"Transfer recorded. A blockchain provider must broadcast it in production."});
}