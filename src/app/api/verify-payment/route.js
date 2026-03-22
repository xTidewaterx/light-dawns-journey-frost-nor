// src/app/api/verify-payment/route.js
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const payment_intent = searchParams.get("payment_intent");

    if (!payment_intent) {
      return NextResponse.json({ ok: false, error: "Missing payment_intent" }, { status: 400 });
    }

    // Retrieve the PaymentIntent from Stripe
    const pi = await stripe.paymentIntents.retrieve(payment_intent);

    // Return consistent JSON
    if (pi.status === "succeeded") {
      return NextResponse.json({
        ok: true,
        status: pi.status,
        amount_received: pi.amount_received,
        currency: pi.currency,
      });
    } else {
      return NextResponse.json({
        ok: false,
        status: pi.status,
        message: "Payment not succeeded yet",
      });
    }
  } catch (err) {
    console.error("verify-payment error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
