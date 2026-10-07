import {db} from "hatchable";
export const access="user";
export const methods=["GET"];
export default async function(req,res){
  const {rows}=await db.query("SELECT id,bank_account_id,amount_usdt,rate_inr,gross_inr,fee_inr,net_inr,status,provider_reference,tx_hash,created_at FROM usdt_withdrawals WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30",[req.user.id]);
  res.json({withdrawals:rows});
}