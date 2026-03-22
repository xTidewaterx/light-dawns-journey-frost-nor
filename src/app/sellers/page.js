'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Montserrat, Quicksand } from 'next/font/google';
import { app } from '../../firebase/firebaseConfig';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import OnboardingNotice from '../components/OnboardingNotice';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const db = getFirestore(app);

const TEMP_NORWAY_STOCK_PHOTOS = [
  'https://images.pexels.com/photos/3222422/pexels-photo-3222422.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1468379/pexels-photo-1468379.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2050994/pexels-photo-2050994.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/532220/pexels-photo-532220.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

const getTempSellerPhoto = (index) => TEMP_NORWAY_STOCK_PHOTOS[index % TEMP_NORWAY_STOCK_PHOTOS.length];

export default function GetProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchProfiles() {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = querySnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setProfiles(users);
    }

    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter((profile) =>
    profile.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 bg-white">
      <h2 className={`${montserrat.className} text-4xl font-semibold text-center text-gray-900 mb-6`}>
        Skapere
      </h2>

      <div className="mx-auto mb-8 max-w-3xl">
        <OnboardingNotice
          storageKey="norya_sellers_page_intro_seen"
          title="Vil du selge på NORYA?"
          buttonLabel="Skjønner"
        >
          Opprett eller logg inn på konto, gå til Min Profil, og trykk Nytt Produkt for å publisere dine første varer.
          <div className="mt-3">
            <Link href="/profile" className="font-semibold text-sky-700 underline underline-offset-4 hover:text-sky-800">
              Gå til Min Profil
            </Link>
          </div>
        </OnboardingNotice>
      </div>

      <div className="mb-10 flex justify-center">
        <input
          type="text"
          placeholder="Søk etter navn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${quicksand.className} w-full sm:w-1/2 px-4 py-2 rounded-xl border-[3px] border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500`}
        />
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredProfiles.map((profile, index) => (
          <li key={profile.id} className="mb-18">
            <Link href={`/profile/${profile.id}`} className="block group">
              <div className="flex flex-col items-center space-y-4">
                <img
                  alt={profile.displayName || 'Profile'}
                  src={getTempSellerPhoto(index)}
                  className="h-[180px] w-[160px] sm:h-[220px] sm:w-[200px] md:h-[245px] md:w-[220px] lg:h-[270px] lg:w-[240px] rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <p className={`${quicksand.className} text-lg font-medium text-gray-900 text-center`}>
                  {profile.displayName || 'Uten navn'}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
