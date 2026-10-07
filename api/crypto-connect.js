import { db } from "hatchable";

export const access = "user";
export const methods = ["POST"];

function validTronAddress(a){ return typeof a==="string" && /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a); }

export default async function(req,res){
  const {address}=req.body||{};
  if(!validTronAddress(address)) return res.status(400).json({error:"Enter a valid TRON mainnet address."});
  await db.query("INSERT INTO crypto_wallets (user_id,network,address) VALUES ($1,'TRC20',$2) ON CONFLICT (user_id) DO UPDATE SET network='TRC20',address=$2",[req.user.id,address]);
  res.json({ok:true,address,network:"TRC20"});
}