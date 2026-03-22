"use client";

import React from 'react';
import GetProducts from '../components/homePage/get/GetProducts';

export default function GetProductsFunction() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f7fa] pt-28 pb-12">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#d6e8f6]/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-32 h-80 w-80 rounded-full bg-[#bfd7ec]/50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1600px]">
        <GetProducts variant="products-page" />
      </div>
    </main>
  );
}
