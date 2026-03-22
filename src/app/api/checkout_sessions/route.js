import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SHIPPING_OPTIONS = {
  standard: { id: 'standard', name: 'Standard frakt (2-4 dager)', cost: 5000 },
  express: { id: 'express', name: 'Ekspressfrakt (1-2 dager)', cost: 15000 },
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { items, shipping } = body;

    console.log("📥 Received checkout request:", { items, shipping });

    if (!items || !Array.isArray(items) || items.length === 0) {
      const errMsg = 'No items in request';
      console.error("❌ Validation error:", errMsg);
      return new Response(JSON.stringify({ error: errMsg }), { status: 400 });
    }

    // Build Stripe line items using server-trusted product prices.
    const lineItems = await Promise.all(
      items.map(async (item, idx) => {
        const productId = item.id || item.productId;
        const quantity = Number(item.quantity || 1);

        if (!productId || typeof productId !== 'string') {
          throw new Error(`Item ${idx} is missing a valid product id`);
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error(`Item ${idx} has invalid quantity: ${item.quantity}`);
        }

        const product = await stripe.products.retrieve(productId);
        if (!product?.default_price) {
          throw new Error(`Product ${productId} has no default price`);
        }

        const priceData = await stripe.prices.retrieve(product.default_price);
        const amount = priceData?.unit_amount;

        if (!Number.isInteger(amount) || amount <= 0) {
          throw new Error(`Product ${productId} has invalid unit amount: ${amount}`);
        }

        console.log("Trusted line item amount (øre):", amount, "name:", product.name, "qty:", quantity);

        return {
          price_data: {
            currency: 'nok',
            product_data: { name: product.name },
            unit_amount: amount,
          },
          quantity,
        };
      })
    );

    // Add shipping as a line item
    const shippingId = shipping?.method || 'standard';
    const selectedShipping = SHIPPING_OPTIONS[shippingId] || SHIPPING_OPTIONS.standard;

    console.log("Trusted shipping (øre):", selectedShipping.cost, "method:", selectedShipping.id);

    lineItems.push({
      price_data: {
        currency: 'nok',
        product_data: { name: selectedShipping.name },
        unit_amount: selectedShipping.cost,
      },
      quantity: 1,
    });

    // Calculate total
    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0
    );

    console.log("💳 TOTAL amount being sent to Stripe:", totalAmount, "øre =", (totalAmount / 100).toFixed(2), "NOK");

    // Validate amount
    if (!Number.isInteger(totalAmount) || totalAmount < 300) {
      const errMsg = `Invalid total amount: ${totalAmount} øre (minimum 300 øre / 3 NOK required)`;
      console.error("❌", errMsg);
      return new Response(JSON.stringify({ error: errMsg }), { status: 400 });
    }

    // Validate line items
    lineItems.forEach((item, idx) => {
      const amt = item.price_data.unit_amount;
      const total = amt * item.quantity;
      console.log(`  Item ${idx}: ${item.price_data.product_data.name} | ${amt} øre × ${item.quantity} = ${total} øre`);
      if (total < 50) {
        console.warn(`  ⚠️  Item ${idx} total is very small: ${total} øre`);
      }
    });




    // Attach shipping metadata so webhook can create shipment after success
    const metadata = {};
    try {
      // Only include essential shipping data for webhook (keep under Stripe's 500 char limit per field)
      const essentialShipping = shipping ? {
        id: selectedShipping.id,
        name: selectedShipping.name,
        cost: selectedShipping.cost,
        // Only include minimal customer data needed for shipment
        customerData: shipping.customerData ? {
          name: shipping.customerData.name,
          email: shipping.customerData.email,
          phone: shipping.customerData.phone,
          street: shipping.customerData.street,
          streetNumber: shipping.customerData.streetNumber,
          city: shipping.customerData.city,
          postcode: shipping.customerData.postcode,
          country: shipping.customerData.country,
        } : null
      } : null;

      const shippingStr = essentialShipping ? JSON.stringify(essentialShipping) : "";
      const itemsStr = JSON.stringify(items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })));
      
      metadata.shipping = shippingStr.slice(0, 500);
      metadata.items = itemsStr.slice(0, 500);
      
      console.log("Metadata size - shipping:", metadata.shipping.length, "chars, items:", metadata.items.length, "chars");
      
      if (shippingStr.length > 500) {
        console.warn("⚠️ Shipping metadata truncated from", shippingStr.length, "to 500 chars");
      }
    } catch (e) {
      console.warn("Could not stringify metadata for Stripe:", e.message);
      metadata.shipping = "";
      metadata.items = "";
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'nok',
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    console.log('✅ PaymentIntent created:', paymentIntent.id, 'status:', paymentIntent.status);
    return new Response(JSON.stringify({ client_secret: paymentIntent.client_secret }), { status: 200 });

  } catch (err) {
    console.error('❌ ERROR creating checkout session');
    console.error('  Message:', err.message);
    console.error('  Type:', err.type);
    
    if (err.statusCode) {
      console.error('  Stripe Status:', err.statusCode);
    }
    if (err.param) {
      console.error('  Invalid Param:', err.param);
    }
    if (err.charge) {
      console.error('  Charge ID:', err.charge);
    }
    if (err.decline_code) {
      console.error('  Decline Code:', err.decline_code);
    }

    // Log full error for debugging
    console.error('  Full Error:', JSON.stringify(err, null, 2));

    // Return user-friendly message
    let userMsg = "Feil ved betaling. Prøv igjen.";
    let status = 500;

    if (err.message.includes('missing a valid product id')) {
      userMsg = "Mangler produkt-ID i handlekurven. Oppdater siden og legg varen i handlekurven på nytt.";
      status = 400;
    }
    if (err.message.includes('minimum')) {
      userMsg = "Ordresummen må være minst 3 NOK.";
      status = 400;
    } else if (err.message.includes('currency')) {
      userMsg = "Valutafeil. Kontakt support.";
      status = 400;
    } else if (err.type === 'StripeInvalidRequestError') {
      userMsg = `Ugyldig betalingsforespørsel: ${err.message}`;
      status = 400;
    }

    return new Response(JSON.stringify({ error: userMsg }), { status });
  }
}
