'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from './auth/authContext';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

import MainBanner from './components/homePage/banner/MainBanner';
import GetProducts from './components/homePage/get/GetProducts';
import UserRow from './components/UserRow';

export default function Home() {
  const DEFAULT_CREATOR_FACE = 'https://firebasestorage.googleapis.com/v0/b/norland-a7730.appspot.com/o/profile%2FA%20rectangular%20default%20profile%20edit.png?alt=media&token=f00d3c5c-4d54-4af8-8f89-dba56cefb708';
  const [creatorFaceUrl, setCreatorFaceUrl] = useState(DEFAULT_CREATOR_FACE);

  useEffect(() => {
    async function fetchCreatorFace() {
      try {
        const snapshot = await getDocs(collection(db, 'publicUsers'));
        const photos = snapshot.docs
          .map((doc) => doc.data()?.photoURL)
          .filter((url) => typeof url === 'string' && url.trim().length > 0);

        if (photos.length >= 2) {
          setCreatorFaceUrl(photos[1]);
          return;
        }

        if (photos.length === 1) {
          setCreatorFaceUrl(photos[0]);
        }
      } catch (error) {
        console.error('Could not load skaper face for homepage banner:', error);
      }
    }

    fetchCreatorFace();
  }, []);

  return (
    <AuthProvider>
      {/* Optional navigation bar */}
      {/* <Navbar /> */}

      <MainBanner />

      <section className="px-4 sm:px-8 lg:px-12 py-[3.25rem] sm:py-[4.5rem] bg-[#0a1f44]">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[26px] bg-[#0a1f44] lg:grid lg:grid-cols-2">
          <div className="p-6 sm:p-8 lg:p-10">
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

          <div className="relative w-full aspect-square md:aspect-square p-2 sm:p-3">
            <div
              className="absolute inset-2 sm:inset-3 rounded-2xl"
              style={{
                backgroundImage: `url(${creatorFaceUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        </div>
      </section>

      <div className="bg-gradient-to-b from-[#f6f9fd] via-[#ecf2f9] to-[#e2ebf6] pb-12 sm:pb-16">
        <UserRow />
        <GetProducts />
      </div>

    </AuthProvider>
  );
}