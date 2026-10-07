import { db } from "hatchable";

export const access = "user";
export const methods = ["POST"];

function validTronAddress(a){ return typeof a==="string" && /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a); }

export default async function(req,res){
  const {amount,address,txHash}=req.body||{};
  const a=Number(amount);
  if(!Number.isFinite(a)||a<=0||!validTronAddress(address)) return res.status(400).json({error:"Enter a valid USDT amount and TRON address."});
  const {rows}=await db.query("SELECT address FROM crypto_wallets WHERE user_id=$1",[req.user.id]);
  if(!rows[0]?.address) return res.status(400).json({error:"Connect a TRON wallet first."});
  if(rows[0].address===address) return res.status(400).json({error:"Recipient is the same as your wallet."});
  if(!txHash) return res.status(400).json({error:"Blockchain transaction hash is required."});
  await db.query("INSERT INTO crypto_transactions (user_id,type,amount_usdt,network,counterparty,tx_hash,status) VALUES ($1,'SEND',$2,'TRC20',$3,$4,'BROADCAST')",[req.user.id,a,address,txHash]);
  res.json({ok:true,network:"TRC20",amount:a,address,txHash,status:"BROADCAST"});
}