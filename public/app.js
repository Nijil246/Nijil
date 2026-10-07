let me=null,txns=[],crypto=null;
const $=id=>document.getElementById(id);
const money=n=>"₹"+(Number(n)/100).toLocaleString("en-IN",{minimumFractionDigits:2});
const USDT_CONTRACT="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

async function api(path,opts={}){const r=await fetch(path,opts),d=await r.json();if(!r.ok)throw Error(d.error||"Something went wrong");return d}

async function load(){
  try{
    me=await api("/api/me");
    $("avatar").textContent=(me.user.name||me.user.email||"U")[0].toUpperCase();
    $("upi").textContent=me.wallet.upi_id;
    $("upiChip").textContent=me.wallet.upi_id;
    $("balance").textContent=money(me.wallet.balance_paise);
    $("assetInr").textContent=money(me.wallet.balance_paise);
    txns=await api("/api/transactions");
    crypto=await api("/api/crypto");
    $("usdt").textContent=Number(crypto.wallet.balance_usdt||0).toFixed(6);
    $("assetUsdt").textContent=Number(crypto.wallet.balance_usdt||0).toFixed(6)+" USDT";
    $("network").textContent=crypto.wallet.address?"TRC20 · "+crypto.wallet.address.slice(0,8)+"…"+crypto.wallet.address.slice(-6):"TRC20 · Not connected";
    renderTotal();renderRecent();
  }catch(e){console.error(e)}
}

function renderTotal(){
  let inr=Number(me?.wallet?.balance_paise||0)/100;
  let u=Number(crypto?.wallet?.balance_usdt||0);
  $("totalBalance").textContent="₹"+inr.toLocaleString("en-IN",{minimumFractionDigits:2})+" + "+u.toFixed(2)+" USDT";
}

function renderRecent(){
  let all=[...txns.map(t=>({...t,crypto:false})),...(crypto?.transactions||[]).map(t=>({...t,crypto:true}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  $("recent").innerHTML=all.slice(0,6).map(txn).join("")||'<p style="color:#777">No transactions yet.</p>';
}

function txn(t){
  let out=t.type==="PAYMENT"||t.type==="SEND";
  let amt=t.crypto?Number(t.amount_usdt).toFixed(6)+" USDT":money(t.amount_paise);
  return '<div class="txn"><div class="txicon">'+(t.crypto?"₮":(out?"↗":"＋"))+'</div><div class="txmain"><b>'+esc(t.counterparty||"UPI Pay")+'</b><small>'+esc(t.note||t.type)+" · "+new Date(t.created_at).toLocaleDateString("en-IN")+'</small></div><div class="txamt '+(out?"out":"in")+'">'+(out?"−":"+")+amt+"</div></div>"
}

function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function show(page){if(page==="transactions")openModal("history");else if(page==="profile")openModal("profile");else window.scrollTo({top:0,behavior:"smooth"})}
function closeModal(){$("modal").classList.add("hidden")}

async function connectTronWallet(){
  try{
    if(!window.tronLink){
      alert("Open UPI Pay inside the TronLink wallet browser, or install TronLink on your device.");
      return;
    }
    await window.tronLink.request({method:"tron_requestAccounts"});
    const address=window.tronWeb?.defaultAddress?.base58;
    if(!address) throw Error("TRON wallet address was not available.");
    await api("/api/crypto-connect",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address})});
    await load();
    alert("TRON wallet connected: "+address);
  }catch(e){alert(e.message)}
}

function openModal(type){
  let c="";
  if(type==="wallet")c='<h2>Unified Wallet</h2><p>INR stays in the app wallet. USDT is now linked to your real TRON wallet.</p><div class="asset-row"><div class="asset-icon inr">₹</div><div class="asset-main"><b>INR / UPI</b><small>'+esc(me?.wallet?.upi_id||"")+'</small></div><strong>'+money(me?.wallet?.balance_paise||0)+'</strong></div><div class="asset-row"><div class="asset-icon usdt-icon">₮</div><div class="asset-main"><b>USDT</b><small>TRC20 · live blockchain balance</small></div><strong>'+Number(crypto?.wallet?.balance_usdt||0).toFixed(6)+'</strong></div><button class="primary" onclick="connectTronWallet()">'+(crypto?.wallet?.address?"Reconnect TRON Wallet":"Connect TRON Wallet")+'</button>';
  if(type==="usdt-send")c='<h2>Send USDT</h2><p>Live TRC20 transfer. Your connected TRON wallet signs the transaction; UPI Pay never receives your private key.</p><div class="field"><label>Network</label><input value="TRC20 · TRON Mainnet" disabled></div><div class="field"><label>USDT wallet address</label><input id="cryptoTo" placeholder="T... recipient address"></div><div class="field"><label>Amount</label><input id="cryptoAmt" type="number" min="0.000001" step="0.000001" placeholder="0.000000"></div><button class="primary" onclick="sendUsdt()">Sign &amp; Send USDT</button>';
  if(type==="usdt-cashout")c='<h2>USDT → INR → Bank</h2><p>Convert your live TRC20 USDT balance to INR and request a bank payout.</p><div class="field"><label>USDT amount</label><input id="cashAmt" type="number" min="0.000001" step="0.000001" placeholder="0.000000" oninput="refreshQuote()"></div><div id="quoteBox" class="quote-box">Enter an amount to see the INR quote.</div><div id="bankBox"></div><button class="primary" onclick="submitCashout()">Request bank payout</button><div class="provider-note">Bank transfer is pending compliant payout-provider integration. No transfer is marked complete until the provider confirms it.</div>';
  if(type==="usdt-receive")c='<h2>Receive USDT</h2><p>Send only TRC20 USDT to this address.</p><div style="padding:18px;background:#f5f3fa;border-radius:16px;word-break:break-all;font-weight:700;font-size:13px">'+esc(crypto?.wallet?.address||"Not connected")+'</div><button class="primary" onclick="copyAddress()">Copy Address</button>';
  if(type==="pay")c='<h2>Send Money</h2><p>Pay any UPI ID from your unified wallet.</p><div class="field"><label>UPI ID / Mobile</label><input id="to" placeholder="name@bank"></div><div class="field"><label>Amount</label><input id="amt" type="number" min="1" placeholder="₹ 0"></div><div class="field"><label>Note</label><input id="note" placeholder="Optional"></div><button class="primary" onclick="pay()">Pay securely</button>';
  if(type==="add")c='<h2>Add Money</h2><p>Add INR to your unified wallet.</p><div class="field"><label>Amount</label><input id="addamt" type="number" min="1" placeholder="₹ 500"></div><button class="primary" onclick="addMoney()">Add ₹ to wallet</button>';
  if(type==="scan")c='<h2>Scan &amp; Pay</h2><p>Scan a merchant UPI QR code.</p><div style="height:220px;border-radius:20px;background:#111;color:#fff;display:grid;place-items:center;font-size:70px">⌁</div><button class="primary">Open Camera</button>';
  if(type==="history")c='<h2>Wallet Activity</h2><div>'+[...txns.map(t=>({...t,crypto:false})),...(crypto?.transactions||[]).map(t=>({...t,crypto:true}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(txn).join("")+"</div>";
  if(type==="profile")c='<div class="profile"><div class="bigavatar">'+(me?.user?.name||me?.user?.email||"U")[0].toUpperCase()+'</div><h2>'+esc(me?.user?.name||"UPI Pay User")+'</h2><p>'+esc(me?.user?.email||"")+'</p><div class="stat"><b>Unified Wallet</b><br><small>INR + live TRC20 USDT</small></div><div class="stat"><b>UPI ID</b><br><small>'+esc(me?.wallet?.upi_id||"")+'</small></div><div class="stat"><b>TRON Address</b><br><small>'+esc(crypto?.wallet?.address||"Not connected")+'</small></div></div>';
  $("modalContent").innerHTML=c;$("modal").classList.remove("hidden");if(type==="usdt-cashout")openCashoutBank()
}

async function copyAddress(){if(!crypto?.wallet?.address)return alert("Connect a TRON wallet first.");await navigator.clipboard?.writeText(crypto.wallet.address);alert("Address copied")}

async function addMoney(){try{await api("/api/add-money",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:$("addamt").value})});closeModal();await load();alert("Wallet topped up.")}catch(e){alert(e.message)}}
async function pay(){try{await api("/api/pay",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:$("amt").value,counterparty:$("to").value,note:$("note").value})});closeModal();await load();alert("Payment recorded.")}catch(e){alert(e.message)}}

async function refreshQuote(){
  const amount=Number($("cashAmt")?.value);
  if(!amount){$("quoteBox").textContent="Enter an amount to see the INR quote.";return}
  try{
    const q=await api("/api/usdt-quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount})});
    $("quoteBox").innerHTML="<b>"+q.amount_usdt.toFixed(6)+" USDT</b> × ₹"+q.rate_inr.toFixed(2)+"<br>Gross ₹"+q.gross_inr.toFixed(2)+" · Fee ₹"+q.fee_inr.toFixed(2)+"<br><strong>Estimated bank payout: ₹"+q.net_inr.toFixed(2)+"</strong>";
  }catch(e){$("quoteBox").textContent=e.message}
}
async function openCashoutBank(){
  const r=await api("/api/bank-accounts");
  const list=r.accounts||[];
  $("bankBox").innerHTML='<div class="field"><label>Bank account</label><select id="bankId">'+list.map(a=>'<option value="'+a.id+'">'+esc(a.bank_name)+' · A/C ••••'+esc(a.account_last4)+' · '+esc(a.ifsc)+'</option>').join("")+'</select></div><button type="button" class="secondary" onclick="addBank()">＋ Add bank account</button>';
}
async function addBank(){
  const holder=prompt("Account holder name");
  if(!holder)return;
  const bank=prompt("Bank name");
  const account=prompt("Account number");
  const ifsc=prompt("IFSC");
  if(!bank||!account||!ifsc)return;
  try{await api("/api/bank-accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({account_holder:holder,bank_name:bank,account_number:account,ifsc})});await openCashoutBank();alert("Bank account saved for testing.")}
  catch(e){alert(e.message)}
}
async function submitCashout(){
  try{
    const amount=Number($("cashAmt").value), bankId=$("bankId")?.value;
    if(!amount||!bankId)return alert("Enter the USDT amount and select a bank account.");
    if(amount>Number(crypto?.wallet?.balance_usdt||0))return alert("Amount exceeds your live USDT balance.");
    const q=await api("/api/usdt-quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount})});
    if(!confirm("Request conversion of "+amount.toFixed(6)+" USDT for an estimated ₹"+q.net_inr.toFixed(2)+" bank payout?"))return;
    const r=await api("/api/usdt-withdraw",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount,bank_account_id:bankId,rate_inr:q.rate_inr})});
    alert("Withdrawal request created. Status: "+r.withdrawal.status+"\nNo bank transfer has been initiated yet.");
    closeModal();
  }catch(e){alert(e.message)}
}
async function sendUsdt(){
  try{
    if(!crypto?.wallet?.address) return alert("Connect your TRON wallet first.");
    if(!window.tronWeb) return alert("Open UPI Pay inside TronLink to send live USDT.");
    const to=$("cryptoTo").value.trim(), amount=Number($("cryptoAmt").value);
    if(!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(to)) return alert("Enter a valid TRON mainnet address.");
    if(!Number.isFinite(amount)||amount<=0) return alert("Enter a valid USDT amount.");
    if(!confirm("Send "+amount.toFixed(6)+" USDT on TRC20 to "+to+"? This is an irreversible blockchain transaction."))return;
    const active=window.tronWeb.defaultAddress.base58;
    if(active!==crypto.wallet.address) throw Error("Connected wallet changed. Reconnect the wallet.");
    const contract=await window.tronWeb.contract().at(USDT_CONTRACT);
    const txid=await contract.transfer(to,Math.round(amount*1e6)).send({feeLimit:100000000,shouldPollResponse:true});
    await api("/api/crypto-send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount,address:to,txHash:txid})});
    closeModal();await load();alert("USDT sent. TX: "+txid);
  }catch(e){alert(e.message||"Blockchain transfer failed.")}
}

load();