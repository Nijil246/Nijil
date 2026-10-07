export const access="user";
export const methods=["GET"];

export default async function(req,res){
  const configured=Boolean(process.env.XFLOW_SECRET_KEY&&process.env.XFLOW_ACCOUNT_ID);
  res.json({
    provider:"xflow",
    configured,
    live_api_base:"https://api.xflowpay.com",
    stablecoin_network:"TRON",
    stablecoin:"USDT",
    payout_currency:"INR",
    live_withdrawals_enabled:false,
    message:configured
      ?"Xflow credentials are configured. User-level KYC/account activation and stablecoin capability must still be confirmed before enabling live cash-out."
      :"Xflow credentials are not configured. No live bank payout can be initiated."
  });
}