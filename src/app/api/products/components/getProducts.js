"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function GetProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch("/api/products"); // ✅ Make sure this API route exists
      const data = await res.json();
      console.log("get Products api/products: ", data)
      setProducts(data.data); 
    }
    fetchProducts();
  }, []);

  return (
    <div>
      <h2>Featured Products</h2>
      <ul>
        {products?.map((product) => (
          <li key={product.id}>
            <Link href={`/products/${product.id}`}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}






