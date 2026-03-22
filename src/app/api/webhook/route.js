import Stripe from "stripe";
import { headers } from "next/headers";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Convert country names to ISO country codes
function normalizeCountryCode(countryInput) {
  if (!countryInput) return "NO";
  const input = countryInput.toString().trim().toUpperCase();
  
  const countryMap = {
    'DANMARK': 'DK',
    'DENMARK': 'DK',
    'NORGE': 'NO',
    'NORWAY': 'NO',
    'SVERIGE': 'SE',
    'SWEDEN': 'SE',
    'FINLAND': 'FI',
    'SUOMI': 'FI',
    'DK': 'DK',
    'NO': 'NO',
    'SE': 'SE',
    'FI': 'FI',
  };

  return countryMap[input] || input.slice(0, 2).toUpperCase() || "NO";
}

export async function POST(req) {
  // 1. Read the raw body correctly
  const body = await req.arrayBuffer();
  const rawBody = Buffer.from(body);

  // 2. Grab Stripe signature
  const signature = headers().get("stripe-signature");

  let event;

  try {
    // 3. Verify the event
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  // 4. Handle events
  switch (event.type) {
    case "charge.succeeded":
      console.log("💰 Charge succeeded:", event.data.object.id);
      break;

    case "payment_intent.succeeded":
      console.log("✨ Payment Intent success:", event.data.object.id);

      // If shipping metadata exists, create shipment via our API which proxies Shipmondo
      try {
        const metadata = event.data.object.metadata || {};
        if (metadata.shipping) {
          let shippingInfo = {};
          try { 
            shippingInfo = JSON.parse(metadata.shipping); 
          } catch (e) { 
            console.warn("Could not parse shipping metadata:", e.message);
            shippingInfo = { raw: metadata.shipping }; 
          }

          // Extract customer data - prefer customerData from metadata
          const customerData = shippingInfo.customerData || {};
          const details = shippingInfo.details || {};

          // Build full address from customer data
          const address1 = customerData.street 
            ? `${customerData.street} ${customerData.streetNumber || ''}`.trim()
            : (customerData.address || details.address || "");

          // Build a basic shipment request compatible with /api/shipment route
          const shipmentRequest = {
            reference: `Order ${event.data.object.id}`,
            parties: [
              // Sender — use configured env or fallback
              {
                type: "sender",
                name: process.env.SHIPMENT_SENDER_NAME || "NORYA Sender",
                address1: process.env.SHIPMENT_SENDER_ADDRESS1 || "Sender Street 1",
                postal_code: process.env.SHIPMENT_SENDER_POSTCODE || "0000",
                city: process.env.SHIPMENT_SENDER_CITY || "Oslo",
                country_code: process.env.SHIPMENT_SENDER_COUNTRY || "NO",
                email: process.env.SHIPMENT_SENDER_EMAIL || "sender@example.com",
                phone: process.env.SHIPMENT_SENDER_PHONE || "+4712345678",
              },
              // Receiver — from customerData
              {
                type: "receiver",
                name: customerData.name || shippingInfo.name || "Receiver",
                address1: address1,
                postal_code: customerData.postcode || shippingInfo.postal_code || "0000",
                city: customerData.city || shippingInfo.city || "",
                country_code: normalizeCountryCode(customerData.country || shippingInfo.country || "NO"),
                email: customerData.email || shippingInfo.email || "",
                phone: customerData.phone || shippingInfo.phone || "",
              }
            ],
            parcels: [
              {
                weight: 1,
                length: 20,
                width: 15,
                height: 5,
              }
            ],
          };

          console.log("📦 Creating shipment with data:", {
            sender: shipmentRequest.parties[0].name,
            receiver: shipmentRequest.parties[1].name,
            address: shipmentRequest.parties[1].address1,
          });

          const resp = await fetch("/api/shipment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(shipmentRequest),
          });

          const respBody = await resp.text();
          console.log("✅ Shipment creation response status:", resp.status, respBody.slice(0, 300));
        }
      } catch (err) {
        console.error("❌ Failed to create shipment after payment:", err);
      }
      break;

    default:
      console.log("Unhandled event type:", event.type);
  }

  return new Response("OK", { status: 200 });
}
