import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


//To retrieve search parameters from a URL in a GET request, you can utilize the URLSearchParams interface. This allows you to easily manage and access query parameters.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creator');

    if (!creatorId) {
      return NextResponse.json({ error: 'creator query param is required' }, { status: 400 });
    }

    // Fetch all products from Stripe
    const products = await stripe.products.list({ limit: 100 });

    // Filter products by creatorId in metadata
    const creatorProducts = await Promise.all(
      products.data
        .filter((p) => p.metadata?.creatorId === creatorId)
        .map(async (product) => {
          let price = null;
          if (product.default_price) {
            const priceData = await stripe.prices.retrieve(product.default_price);
            price = priceData.unit_amount / 100;
          }

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            images: product.images || product.metadata?.images || [],
            price,
            metadata: product.metadata,
          };
        })
    );

    return NextResponse.json({ data: creatorProducts }, { status: 200 });
  } catch (err) {
    console.error('Error fetching creator products:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
