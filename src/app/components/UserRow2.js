'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import Link from 'next/link';

const DEFAULT_AVATAR_URL =
  'https://firebasestorage.googleapis.com/v0/b/norland-a7730.appspot.com/o/profile%2FA%20rectangular%20default%20profile%20edit.png?alt=media&token=f00d3c5c-4d54-4af8-8f89-dba56cefb708';

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

  return (
    <div className="pb-12 md:pb-16 lg:pb-20">
      <section className="w-full py-12 mb-12 overflow-x-auto custom-scrollbar">
        <h2 className="text-3xl mb-10 text-slate-900 tracking-tight leading-tight font-poppins pl-4">
          Skapere
        </h2>

        <div className="inline-flex gap-6 pb-6 pl-4">
          {users.map(user => (
            <div
              key={user.id}
              className="min-w-[260px] flex flex-col items-center shrink-0 gap-3"
            >
              <Link
                href={`/profile/${user.uid}`}
                className="transition-transform duration-300 ease-in-out hover:scale-[1.03]"
              >
                <div className="avatar-wrapper min-w-76 w-[50vw] sm:w-[180px] md:w-[220px] lg:w-[400px] aspect-square overflow-hidden shadow-md hover:ring-1 hover:ring-slate-300 transition-all">
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR_URL;
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>

              <h3 className="text-base font-bold text-slate-900 text-center tracking-tight font-sans">
                {user.displayName}
              </h3>
              <p className="text-sm text-slate-600 text-center leading-relaxed font-poppins">
                {user.title}
              </p>
            </div>
          ))}
        </div>

        {/* SVG Superellipse Definition */}
        <svg width="0" height="0">
          <defs>
            <clipPath id="superellipse" clipPathUnits="objectBoundingBox">
              <path
                d="
                  M0.5,0
                  C0.85,0,1,0.15,1,0.5
                  C1,0.85,0.85,1,0.5,1
                  C0.15,1,0,0.85,0,0.5
                  C0,0.15,0.15,0,0.5,0
                  Z
                "
              />
            </clipPath>
          </defs>
        </svg>
      </section>

      <style jsx>{`
        .avatar-wrapper {
          clip-path: url(#superellipse);
          border-radius: 0;
        }
      `}</style>
    </div>
  );
}