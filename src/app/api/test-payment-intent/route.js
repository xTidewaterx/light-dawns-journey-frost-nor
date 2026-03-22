// api/test_intent.js or wherever the test route is
export async function POST(req) {
  console.warn("⚠️ /api/test_intent is disabled. Only use /api/checkout_sessions for PaymentIntents.");
  return new Response(JSON.stringify({ error: "Test PaymentIntent disabled" }), { status: 400 });
}
