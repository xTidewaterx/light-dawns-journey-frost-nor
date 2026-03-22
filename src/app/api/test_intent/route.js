import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1,
      currency: "nok",
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({ id: paymentIntent.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ API Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
