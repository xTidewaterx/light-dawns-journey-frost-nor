"use client";
import { useEffect } from "react";
import { useCart } from "react-use-cart";

export default function CartButton({ product }) {
  const { addItem, items } = useCart();

  function AddProduct() {
    addItem(product);
    console.log("added product: ", product);
  }

  useEffect(() => {
    const productsInCart = items.map((item) => item);

    console.log(productsInCart);
  }, [items]);

  return (
    <button
      className="mt-6 px-6 py-2 bg-gray-900 text-white text-lg font-semibold rounded-lg hover:bg-gray-700 transition duration-300"
      onClick={() => {
        AddProduct();
      }}
    >
      Add to Cart
    </button>
  );
}
