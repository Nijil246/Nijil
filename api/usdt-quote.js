export const access="user";
export const methods=["POST"];
export default async function(req,res){
  const amount=Number(req.body?.amount);
  if(!Number.isFinite(amount)||amount<=0) return res.status(400).json({error:"Enter a valid USDT amount."});
  const rate=Number(req.body?.rate||96.37);
  const fee=Math.max(10,amount*rate*0.01);
  const gross=amount*rate;
  res.json({amount_usdt:amount,rate_inr:rate,gross_inr:Number(gross.toFixed(2)),fee_inr:Number(fee.toFixed(2)),net_inr:Number((gross-fee).toFixed(2)),provider_required:true});
}