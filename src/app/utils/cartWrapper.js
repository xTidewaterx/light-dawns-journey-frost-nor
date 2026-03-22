"use client";
import { CartProvider } from "react-use-cart";

export default function CartWrapper({ children, className }) {
  return <CartProvider>
    <div className={className}>
      {children}
    </div>
  </CartProvider>;
}
