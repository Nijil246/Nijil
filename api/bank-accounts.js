import {db} from "hatchable";
export const access="user";
export const methods=["GET","POST"];
function validIfsc(x){return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(x||"").toUpperCase());}
export default async function(req,res){
  if(req.method==="GET"){
    const {rows}=await db.query("SELECT id,account_holder,bank_name,account_last4,ifsc,verified,created_at FROM usdt_bank_accounts WHERE user_id=$1 ORDER BY created_at DESC",[req.user.id]);
    return res.json({accounts:rows});
  }
  const b=req.body||{}, holder=String(b.account_holder||"").trim(), bank=String(b.bank_name||"").trim(), account=String(b.account_number||"").replace(/\s/g,""), ifsc=String(b.ifsc||"").trim().toUpperCase();
  if(!holder||!bank||!/^\d{9,18}$/.test(account)||!validIfsc(ifsc)) return res.status(400).json({error:"Enter valid account holder, bank, account number and IFSC."});
  const {rows}=await db.query("INSERT INTO usdt_bank_accounts (user_id,account_holder,bank_name,account_last4,ifsc) VALUES ($1,$2,$3,$4,$5) RETURNING id,account_holder,bank_name,account_last4,ifsc,verified,created_at",[req.user.id,holder,bank,account.slice(-4),ifsc]);
  res.json({account:rows[0],note:"Bank details saved for testing. Production payout requires a connected compliant provider."});
}