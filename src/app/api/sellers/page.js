"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CartProvider, useCart } from "react-use-cart";

export default function GetProducts() {
  const [products, setProducts] = useState([]);
   const {addItem} = useCart();
  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.data); // Stripe returns products in `data`
    }
    fetchProducts();
  }, []);

  return (
    <CartProvider>
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-lg font-bold">Featured Products</h2>
      <ul className="mt-4 space-y-4">
        {products?.map((product) => (
          <li key={product?.id} className="p-4 bg-gray-100 rounded">
            <Link href={`/products/${product?.id}`}>
          <button onClick={()=> addItem(product)}>Add to cart</button>
            <h3 className="text-md font-semibold">{product.name}</h3>
            <p className="text-sm text-gray-600">{product.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
    </CartProvider>
  );
}