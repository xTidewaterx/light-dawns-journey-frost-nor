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

      <section className="px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white/85 p-6 sm:p-8 lg:p-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-slate-500 mb-3">
            Skapt i Nord-Norge
          </p>
          <h2 className="text-2xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
            Bli kjent med skaperne først - og kjøp håndverk direkte fra profilene deres.
          </h2>
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-600 max-w-3xl leading-relaxed">
            NORYA samler tradisjon, nyvinning og kvalitet i ett sted. Når du kjenner historiene bak produktene,
            blir valgene tryggere, mer personlige og mer meningsfulle.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sellers"
              className="btn-scandi-primary text-sm sm:text-base"
              style={{ color: '#ffffff' }}
            >
              <span style={{ color: '#ffffff' }}>Møt skaperne</span>
            </Link>
            <Link
              href="/omoss"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm sm:text-base font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              Om NORYA
            </Link>
          </div>
        </div>
      </section>

      <UserRow />

      <div className="pb-16 sm:pb-24">
        <GetProducts />
      </div>

    </AuthProvider>
  );
}