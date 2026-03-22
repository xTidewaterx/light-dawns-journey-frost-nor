import { notFound, redirect } from "next/navigation";
import Stripe from "stripe";

import CartWrapper from "../../../app/utils/cartWrapper";
import PostProduct from "../../post/PostProduct";

import ProductDetailView from "../../components/productDetailPage/ProductDetailView";
import GetProducts from "../../components/productDetailPage/get/GetProducts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getProduct(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products?id=${id}`);
  if (!res.ok) return null;
  return res.json();
}

async function getProductPrice(productId) {
  const product = await stripe.products.retrieve(productId);
  const price = await stripe.prices.retrieve(product.default_price);
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    price_amount: price.unit_amount,
    currency: price.currency,
    default_price_id: product.default_price,
  };
}

export default async function ProductDetail({ params, searchParams }) {
  const { id } = params;
  const product = await getProduct(id);
  if (!product) notFound();

  const stripeProduct = await getProductPrice(product.id);


  console.log("Fetched product details:", { product, stripeProduct });
  const completeProduct = {
    id: product.id,
    name: stripeProduct.name,
    description: stripeProduct.description,
    images: stripeProduct.images,
    price: stripeProduct.price_amount,
    currency: stripeProduct.currency,
    default_price_id: stripeProduct.default_price_id,
    creatorId: product.metadata?.creatorId || null,
    artist: product.name || "Unknown Artist",
  };

  const isEditing = searchParams?.edit === "true";
  if (searchParams?.saved === "true") redirect(`/products/${id}?edit=false`);

  return (
    <CartWrapper>
      <div className="bg-slate-50 px-4 pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="mx-auto w-full max-w-6xl">
          <div className="bg-white rounded-3xl shadow-none p-5 sm:p-8">
            {isEditing ? (
              <PostProduct currentProduct={completeProduct} />
            ) : (
              <ProductDetailView completeProduct={completeProduct} id={id} />
            )}
          </div>
        </div>
      </div>
      <GetProducts />
    </CartWrapper>
  );
}
