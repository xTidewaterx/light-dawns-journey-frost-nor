"use client";
import { useEffect } from "react";
import { useCart } from "react-use-cart";

export default function CartButton({ product, className = "" }) {
  const { addItem, items } = useCart();



function AddProduct() {



 addItem(product)
 console.log("added product: ", product)

  


}



useEffect(() => {

    const productsInCart = items.map((item) => item);

    console.log(productsInCart)

}, [items])

  return (
    <button
      type="button"
      className={`block w-full rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800 ${className}`}
      onClick={() => {AddProduct()}}
    >
      Legg i handlekurv
    </button>
  );
}