'use client';

import { AuthProvider } from './auth/authContext';
import Link from 'next/link';

import MainBanner from './components/homePage/banner/MainBanner';
import GetProducts from './components/homePage/get/GetProducts';
import UserRow from './components/UserRow';

export default function Home() {
  return (
    <AuthProvider>
      {/* Optional navigation bar */}
      {/* <Navbar /> */}

      <MainBanner />

      <section className="px-4 sm:px-8 lg:px-12 py-[3.25rem] sm:py-[4.5rem] bg-[#0a1f44]">
        <div className="mx-auto max-w-6xl rounded-3xl bg-[#0a1f44] p-6 sm:p-8 lg:p-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-blue-100/85 mb-3">
            Skapt i Nord-Norge
          </p>
          <h2 className="text-2xl sm:text-4xl text-white tracking-tight leading-tight">
            Bli kjent med skaperne først - og kjøp håndverk direkte fra profilene deres.
          </h2>
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-blue-100/90 max-w-3xl leading-relaxed">
            NORYA samler tradisjon, nyvinning og kvalitet i ett sted. Når du kjenner historiene bak produktene,
            blir valgene tryggere, mer personlige og mer meningsfulle.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sellers"
              className="inline-flex items-center rounded-full bg-[#f4c542] px-5 py-2.5 text-sm sm:text-base font-semibold text-[#0a1f44] transition-colors hover:bg-[#ffd766]"
            >
              Møt skaperne
            </Link>
            <Link
              href="/omoss"
              className="inline-flex items-center rounded-full border border-white/85 bg-white px-5 py-2.5 text-sm sm:text-base font-medium text-[#0a1f44] transition-colors hover:bg-[#f8fafc]"
            >
              Om NORYA
            </Link>
          </div>
        </div>
      </section>

      <div className="bg-[#0a3a7a]/22 pb-12 sm:pb-16">
        <UserRow />
        <GetProducts />
      </div>

    </AuthProvider>
  );
}