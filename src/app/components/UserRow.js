'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import Link from 'next/link';

export default function UserRow() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snapshot = await getDocs(collection(db, 'publicUsers'));
        const data = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            user =>
              user.photoURL &&
              user.uid &&
              user.displayName &&
              typeof user.photoURL === 'string' &&
              typeof user.uid === 'string'
          );
        setUsers(data);
        console.log('userRow: ', data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }

    fetchUsers();
  }, []);

  const featuredUsers = users.slice(0, 6);

  return (
    <section className="pt-2 pb-8 md:pb-10 lg:pb-12 px-4">
      <div className="pt-8 sm:pt-10 mb-7">
        <h2 className="text-3xl text-slate-900 tracking-tight leading-tight font-poppins">
          Møt skaperne
        </h2>
      </div>

      {featuredUsers.length === 0 ? (
        <p className="text-slate-500 font-poppins">Laster skaperprofiler...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {featuredUsers.map((user) => (
            <Link key={user.id} href={`/profile/${user.uid}`} className="group block">
              <div className="relative w-full aspect-square overflow-hidden rounded-none bg-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out group-hover:shadow-[0_18px_40px_rgba(15,23,42,0.22)]">
                <img
                  src={user.photoURL || '/default-avatar.png'}
                  alt={user.displayName || 'Skaper'}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_20%,rgba(255,255,255,0.36),rgba(255,255,255,0)_44%)] opacity-85 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                  <p className="truncate text-xs sm:text-sm font-medium text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                    {user.displayName}
                  </p>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-[#0b5fff] px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-white shadow-[0_4px_14px_rgba(11,95,255,0.45)] transition-colors duration-200 group-hover:bg-[#004de0]">
                    Se profil
                  </span>
                </div>

                <div className="pointer-events-none absolute inset-0 ring-1 ring-white/0 transition-all duration-300 group-hover:ring-white/35" />
                <span className="sr-only">
                  Se profilen til {user.displayName || 'skaper'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}