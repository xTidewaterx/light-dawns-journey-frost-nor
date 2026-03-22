import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { priceId } = body;

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Missing priceId' }), { status: 400 });
    }

    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });

    return new Response(JSON.stringify(price), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Failed to fetch price:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}