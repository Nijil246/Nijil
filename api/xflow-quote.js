export const access="user";
export const methods=["POST"];

const BASE="https://api.xflowpay.com";

export default async function(req,res){
  const amount=Number(req.body?.amount);
  if(!Number.isFinite(amount)||amount<=0) return res.status(400).json({error:"Enter a valid USDT amount."});

  const key=process.env.XFLOW_SECRET_KEY;
  const accountId=process.env.XFLOW_ACCOUNT_ID;

  if(!key||!accountId){
    return res.json({
      provider:"xflow",
      configured:false,
      provider_required:true,
      message:"Xflow is not connected yet. Complete Xflow platform onboarding and configure the encrypted project secrets."
    });
  }

  try{
    const url=new URL(BASE+"/v1/quotes");
    url.searchParams.set("sell.amount",amount.toFixed(2));
    url.searchParams.set("sell.currency","USD");
    url.searchParams.set("buy.currency","INR");
    url.searchParams.set("type","payout_fx");

    const r=await fetch(url,{headers:{
      "Authorization":"Bearer "+key,
      "Xflow-Account":accountId
    }});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.errors?.[0]?.message||"Xflow quote request failed.",provider:"xflow"});

    const rate=Number(data?.rate?.user||data?.rate?.mid_market);
    const gross=Number(data?.buy?.amount);
    if(!Number.isFinite(rate)||!Number.isFinite(gross)) return res.status(502).json({error:"Xflow returned an invalid quote.",provider:"xflow"});

    res.json({
      provider:"xflow",
      configured:true,
      provider_required:false,
      amount_usdt:amount,
      assumed_usd_amount:amount,
      rate_inr:Number(rate.toFixed(6)),
      gross_inr:Number(gross.toFixed(2)),
      fee_inr:0,
      net_inr:Number(gross.toFixed(2)),
      quote_id:data.id||null,
      valid_to:data?.rate?.valid_to||null,
      note:"USDT is treated as a 1:1 USD stablecoin amount for this indicative quote. Final provider fees, taxes and settlement terms are determined by the activated Xflow configuration."
    });
  }catch(e){
    res.status(502).json({error:"Unable to reach Xflow.",provider:"xflow"});
  }
}