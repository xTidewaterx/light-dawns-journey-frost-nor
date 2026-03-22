//api/verify-payment.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

export default async function handler(req, res) {
  try {
    const { payment_intent } = req.query;
    if (!payment_intent) return res.status(400).json({ error: "Missing payment_intent" });

    // Retrieve the PaymentIntent from Stripe (server-side)
    const pi = await stripe.paymentIntents.retrieve(payment_intent);

    // Check final status
    if (pi.status === "succeeded") {
      // TODO: mark order as paid in your DB, send receipt, fulfill order, etc.
      return res.json({ ok: true, status: pi.status, amount_received: pi.amount_received });
    } else {
      // handle other statuses: requires_payment_method, requires_action, processing
      return res.json({ ok: false, status: pi.status, message: "Payment not succeeded yet" });
    }
  } catch (err) {
    console.error("verify-payment error:", err);
    return res.status(500).json({ error: err.message });
  }
}
