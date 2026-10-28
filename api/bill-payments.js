import { db } from "hatchable";

export const access = "user";
export const methods = ["GET", "POST"];

export default async function(req, res) {
  if (req.method === "GET") {
    const { rows } = await db.query("SELECT id, bill_type, provider_name, customer_reference, amount_inr, payment_method, status, created_at FROM bill_payment_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30", [req.user.id]);
    return res.json({ requests: rows });
  }
  const body = req.body || {};
  const allowed = ["Mobile", "Electricity", "DTH", "Broadband"];
  const billType = String(body.bill_type || "");
  const providerName = String(body.provider_name || "").trim().slice(0, 120);
  const customerReference = String(body.customer_reference || "").trim().slice(0, 120);
  const amount = Number(body.amount_inr);
  const paymentMethod = String(body.payment_method || "");
  if (!allowed.includes(billType) || !providerName || !customerReference || !Number.isFinite(amount) || amount <= 0 || amount > 1000000 || !["INR", "USDT"].includes(paymentMethod)) {
    return res.status(400).json({ error: "Enter a valid bill type, provider, customer/account reference, bill amount, and payment method." });
  }
  const { rows } = await db.query("INSERT INTO bill_payment_requests (user_id,bill_type,provider_name,customer_reference,amount_inr,payment_method,status) VALUES ($1,$2,$3,$4,$5,$6,'PROVIDER_REQUIRED') RETURNING id,bill_type,provider_name,customer_reference,amount_inr,payment_method,status,created_at", [req.user.id,billType,providerName,customerReference,amount,paymentMethod]);
  return res.status(201).json({ request: rows[0], message: "Bill request saved. Payment is not yet processed: a biller and compliant USDT-to-INR settlement provider must be connected." });
}