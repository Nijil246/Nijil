import {db} from "hatchable";
export const access="user";
export const methods=["POST"];
export default async function(req,res){
  const amount=Number(req.body?.amount), bankId=String(req.body?.bank_account_id||""), rate=Number(req.body?.rate_inr||96.37);
  if(!Number.isFinite(amount)||amount<=0||!bankId||!Number.isFinite(rate)||rate<=0) return res.status(400).json({error:"Invalid withdrawal request."});
  const w=await db.query("SELECT address,balance_usdt FROM crypto_wallets WHERE user_id=$1",[req.user.id]);
  if(!w.rows[0]?.address) return res.status(400).json({error:"Connect your TRON wallet first."});
  if(Number(w.rows[0].balance_usdt)<amount) return res.status(400).json({error:"Insufficient live USDT balance."});
  const b=await db.query("SELECT id FROM usdt_bank_accounts WHERE id=$1 AND user_id=$2",[bankId,req.user.id]);
  if(!b.rows[0]) return res.status(400).json({error:"Bank account not found."});
  const gross=amount*rate, fee=Math.max(10,gross*0.01), net=gross-fee;
  const {rows}=await db.query("INSERT INTO usdt_withdrawals (user_id,bank_account_id,amount_usdt,rate_inr,gross_inr,fee_inr,net_inr) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,status,amount_usdt,rate_inr,gross_inr,fee_inr,net_inr,created_at",[req.user.id,bankId,amount,rate,gross,fee,net]);
  res.json({withdrawal:rows[0],status:"PENDING_PROVIDER",message:"Withdrawal request created. No bank transfer has been initiated because the compliant payout provider is not connected yet."});
}