import { db } from "hatchable";

export const access = "user";
export const methods = ["POST"];

export default async function(req,res){
  const {amount,network}=req.body||{};
  const a=Number(amount);
  if(!Number.isFinite(a)||a<=0) return res.status(400).json({error:"Enter a valid USDT amount."});
  const {rows}=await db.query("SELECT address FROM crypto_wallets WHERE user_id=$1",[req.user.id]);
  await db.query("INSERT INTO crypto_transactions (user_id,type,amount_usdt,network,counterparty,status) VALUES ($1,'RECEIVE_REQUEST',$2,$3,$4,'PENDING')",[req.user.id,a,network||"TRC20",rows[0]?.address||""]);
  res.json({ok:true,address:rows[0]?.address});
}