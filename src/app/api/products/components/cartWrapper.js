"use client";
import { CartProvider } from "react-use-cart";

export default function CartWrapper({ children }) {
  return <CartProvider>{children}</CartProvider>;
}