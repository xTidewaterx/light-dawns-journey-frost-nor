'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import Link from 'next/link';

export default function UserRow() {
  const [users, setUsers] = useState([]);

  const layoutPattern = [
    {
      shell: 'col-span-1 md:col-span-5 md:row-span-2',
      ratio: 'aspect-[4/5] md:aspect-auto',
      offset: 'md:translate-y-1',
      badge: 'Mesterverk',
      tint: 'from-[#0b1f3f]/20 via-transparent to-transparent',
    },
    {
      shell: 'col-span-1 md:col-span-3 md:row-span-2',
      ratio: 'aspect-square md:aspect-auto',
      offset: 'md:-translate-y-1',
      badge: 'Ny',
      tint: 'from-[#11315f]/24 via-transparent to-transparent',
    },
    {
      shell: 'col-span-1 md:col-span-4 md:row-span-2',
      ratio: 'aspect-[5/4] md:aspect-auto',
      offset: 'md:translate-y-1',
      badge: 'Utvalgt',
      tint: 'from-[#1b4b84]/20 via-transparent to-transparent',
    },
    {
      shell: 'col-span-1 md:col-span-4 md:row-span-2',
      ratio: 'aspect-[4/5] md:aspect-auto',
      offset: 'md:-translate-y-1',
      badge: 'Skaper',
      tint: 'from-[#225f9f]/18 via-transparent to-transparent',
    },
    {
      shell: 'col-span-1 md:col-span-5 md:row-span-2',
      ratio: 'aspect-square md:aspect-auto',
      offset: 'md:translate-y-0',
      badge: 'Håndverk',
      tint: 'from-[#1f4370]/18 via-transparent to-transparent',
    },
    {
      shell: 'col-span-1 md:col-span-3 md:row-span-2',
      ratio: 'aspect-[4/5] md:aspect-auto',
      offset: 'md:-translate-y-1',
      badge: 'Portrett',
      tint: 'from-[#142e53]/20 via-transparent to-transparent',
    },
  ];

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
    <section className="relative overflow-hidden px-4 pb-10 pt-6 md:pb-14 lg:pb-20 xl:pb-24">
      <div className="pointer-events-none absolute -left-24 top-24 h-56 w-56 rounded-full bg-[#b8d4ff]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-64 w-64 rounded-full bg-[#d9e8ff]/70 blur-3xl" />

      <div className="relative mb-8 pt-6 sm:pt-8">
        <h2 className="font-poppins text-3xl leading-tight tracking-tight text-slate-900">
          Møt skaperne
        </h2>
        <p className="mt-2 max-w-2xl font-poppins text-sm leading-relaxed text-slate-600">
          Et levende utvalg av profiler med ulike uttrykk, teknikker og historier.
        </p>
      </div>

      {featuredUsers.length === 0 ? (
        <p className="font-poppins text-slate-500">Laster skaperprofiler...</p>
      ) : (
        <div className="relative grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-12 md:auto-rows-[80px] md:gap-5 lg:auto-rows-[104px] xl:auto-rows-[120px] 2xl:auto-rows-[132px]">
          {featuredUsers.map((user, index) => {
            const layout = layoutPattern[index % layoutPattern.length];

            return (
              <Link
                key={user.id}
                href={`/profile/${user.uid}`}
                className={`group block ${layout.shell} ${layout.offset}`}
              >
                <div
                  className={`relative h-full w-full overflow-hidden bg-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition-all duration-500 ease-out ${layout.ratio} group-hover:-translate-y-1 group-hover:rotate-[0.35deg] group-hover:shadow-[0_26px_58px_rgba(15,23,42,0.2)]`}
                >
                  <img
                    src={user.photoURL || '/default-avatar.png'}
                    alt={user.displayName || 'Skaper'}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_16%,rgba(255,255,255,0.34),rgba(255,255,255,0)_43%)]" />
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${layout.tint}`} />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/62 via-black/15 to-transparent" />

                  <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                    <p className="truncate text-xs font-medium text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] sm:text-sm">
                      {user.displayName}
                    </p>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-[#0b5fff] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_4px_14px_rgba(11,95,255,0.45)] transition-colors duration-200 group-hover:bg-[#004de0] sm:text-xs">
                      Se profil
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-0 ring-1 ring-white/0 transition-all duration-300 group-hover:ring-white/30" />

                  <span className="sr-only">
                    Se profilen til {user.displayName || 'skaper'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}