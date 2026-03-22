import Stripe from "stripe";
import { NextResponse } from "next/server";
import { authAdmin, db } from "../../lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Returns decoded token for any authenticated user, null otherwise
async function verifyToken(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return await authAdmin.verifyIdToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

// Returns decoded token if caller is the product owner or an admin, null otherwise
async function verifyOwnerOrAdmin(req, stripeProductId) {
  const decoded = await verifyToken(req);
  if (!decoded) return null;
  try {
    const product = await stripe.products.retrieve(stripeProductId);
    if (product.metadata?.creatorId === decoded.uid) return decoded;
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (userDoc.exists && userDoc.data().role === "admin") return decoded;
  } catch {
    // fall through
  }
  return null;
}

/* ===========================
   GET PRODUCTS OR SINGLE PRODUCT
=========================== */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // If product ID is provided, return that single product
    if (id) {
      const product = await stripe.products.retrieve(id);
      let price = 0;
      let currency = 'nok';

      if (product.default_price) {
        try {
          const priceData = await stripe.prices.retrieve(product.default_price);
          price = priceData.unit_amount / 100;
          currency = priceData.currency || 'nok';
        } catch (err) {
          console.warn(`Failed to retrieve price for product ${product.id}`, err);
        }
      }

      return NextResponse.json({
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        price,
        currency,
        metadata: product.metadata,
      });
    }

    // Fetch all products
    console.log("Fetching all Stripe products...");
    const products = await stripe.products.list({ limit: 6 });

    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        let price = 0;
        let currency = 'nok'; // default currency

        if (product.default_price) {
          try {
            const priceData = await stripe.prices.retrieve(product.default_price);
            price = priceData.unit_amount / 100;
            currency = priceData.currency || 'nok';
          } catch (err) {
            console.warn(`Failed to retrieve price for product ${product.id}`, err);
          }
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          price,
          currency,
          metadata: product.metadata,
        };
      })
    );

    console.log(
      `Fetched ${productsWithPrices.length} products:`,
      productsWithPrices.map(p => ({ id: p.id, price: p.price, currency: p.currency }))
    );

    return NextResponse.json({ data: productsWithPrices });
  } catch (error) {
    console.error("Stripe API error (GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ===========================
   CREATE NEW PRODUCT
=========================== */
export async function POST(req) {
  if (!await verifyToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { name, description, price, images, metadata } = await req.json();

    if (!name || !price) {
      return NextResponse.json(
        { error: "Product name and price are required" },
        { status: 400 }
      );
    }

    console.log("Creating new Stripe product:", { name, description, price, images, metadata });

    const product = await stripe.products.create({
      name,
      description: description || "",
      images: images || [],
      metadata: metadata || {},
    });

    const priceData = await stripe.prices.create({
      unit_amount: Math.round(Number(price)),
      currency: "nok", // default to NOK for new products
      product: product.id,
    });

    const updatedProduct = await stripe.products.update(product.id, {
      default_price: priceData.id,
    });

    console.log("✅ Product created successfully:", updatedProduct.id);

    return NextResponse.json({ product: updatedProduct, price: priceData });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ===========================
   PATCH (UPDATE IMAGES OR PRICE)
=========================== */
export async function PATCH(req) {
  try {
    const { id, images, price, metadata } = await req.json();
    console.log("PATCH request received:", { id, images, price, metadata });

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!await verifyOwnerOrAdmin(req, id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedFields = {};
    if (images) updatedFields.images = images;
    if (metadata) updatedFields.metadata = metadata;

    let newPriceData = null;
    if (price) {
      const parsedPrice = Math.round(Number(price));
      if (isNaN(parsedPrice)) {
        return NextResponse.json(
          { error: "Invalid price format" },
          { status: 400 }
        );
      }

      newPriceData = await stripe.prices.create({
        unit_amount: parsedPrice,
        currency: "nok", // default to NOK
        product: id,
      });

      updatedFields.default_price = newPriceData.id;
    }

    const updatedProduct = await stripe.products.update(id, updatedFields);
    console.log("✅ Product updated:", updatedProduct.id);

    return NextResponse.json({ updatedProduct, newPrice: newPriceData });
  } catch (error) {
    console.error("❌ Error in PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
