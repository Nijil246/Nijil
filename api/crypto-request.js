import { db } from "hatchable";

export const access = "user";
export const methods = ["POST"];

export default async function(req,res){
  const {amount}=req.body||{};
  const a=Number(amount);
  const {rows}=await db.query("SELECT address FROM crypto_wallets WHERE user_id=$1",[req.user.id]);
  if(!rows[0]?.address) return res.status(400).json({error:"Connect a TRON wallet first."});
  if(!Number.isFinite(a)||a<=0) return res.status(400).json({error:"Enter a valid USDT amount."});
  await db.query("INSERT INTO crypto_transactions (user_id,type,amount_usdt,network,counterparty,status) VALUES ($1,'RECEIVE_REQUEST',$2,'TRC20',$3,'PENDING')",[req.user.id,a,rows[0].address]);
  res.json({ok:true,address:rows[0].address,network:"TRC20"});
}