import { db } from "hatchable";

export const access = "user";

const USDT_CONTRACT="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const GRID="https://api.trongrid.io";

async function grid(path){
  const r=await fetch(GRID+path,{headers:{"accept":"application/json"}});
  if(!r.ok) throw Error("TRON network request failed.");
  return r.json();
}

export default async function(req,res){
  const {rows}=await db.query("SELECT network,address,balance_usdt FROM crypto_wallets WHERE user_id=$1",[req.user.id]);
  const wallet=rows[0]||{network:"TRC20",address:null,balance_usdt:0};
  if(!wallet.address){
    return res.json({wallet,transactions:[],live:false,contract:USDT_CONTRACT});
  }
  try{
    const account=await grid("/v1/accounts/"+encodeURIComponent(wallet.address));
    const trc20=(account.data?.[0]?.trc20||[]);
    const raw=trc20.find(x=>Object.prototype.hasOwnProperty.call(x,USDT_CONTRACT))?.[USDT_CONTRACT]||"0";
    const balance=(Number(raw)/1e6).toFixed(6);
    const hist=await grid("/v1/accounts/"+encodeURIComponent(wallet.address)+"/transactions/trc20?only_confirmed=true&limit=30&contract_address="+USDT_CONTRACT);
    const transactions=(hist.data||[]).map(x=>({
      id:x.transaction_id,
      type:x.to===wallet.address?"RECEIVE":"SEND",
      amount_usdt:(Number(x.value||0)/1e6).toFixed(6),
      network:"TRC20",
      counterparty:x.to===wallet.address?x.from:x.to,
      tx_hash:x.transaction_id,
      status:x.confirmed?"CONFIRMED":"PENDING",
      created_at:x.block_timestamp||Date.now()
    }));
    await db.query("UPDATE crypto_wallets SET balance_usdt=$1 WHERE user_id=$2",[balance,req.user.id]);
    res.json({wallet:{...wallet,balance_usdt:balance},transactions,live:true,contract:USDT_CONTRACT,explorer:"https://tronscan.org/#/address/"+wallet.address});
  }catch(e){
    res.json({wallet,transactions:[],live:false,error:"Live TRON data is temporarily unavailable.",contract:USDT_CONTRACT});
  }
}