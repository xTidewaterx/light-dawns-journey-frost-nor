'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../auth/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getFirestore, doc, collection, getDocs } from 'firebase/firestore';
import { app } from '../../firebase/firebaseConfig';
import { saveFavourite } from '../lib/saveFavourite';

const db = getFirestore(app);

export default function FavoritesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchFavorites() {
      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const favouritesRef = collection(userDocRef, 'favourites');
        
        const snapshot = await getDocs(favouritesRef);
        const favoriteIds = snapshot.docs.map(doc => doc.data().productId);

        if (favoriteIds.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        // Fetch product details for each favorite
        const res = await fetch('/api/products');
        const json = await res.json();

        if (json.data) {
          const favoriteProducts = json.data.filter(p => 
            favoriteIds.includes(p.id)
          ).map(p => ({
            id: p.id,
            name: p.name || 'Unnamed product',
            images: p.images?.length ? p.images : ['/fallback.jpg'],
            price: p.price ?? 0,
            currency: p.currency ?? 'NOK',
          }));

          setFavorites(favoriteProducts);
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Failed to load favorites');
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [user]);

  const makeBlur = (color = '#e5e7eb') => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='100%' height='100%' fill='${color}'/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Not logged in
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">Mine Favoritter</h1>
          <div className="bg-white rounded-lg shadow-lg p-12 max-w-md mx-auto">
            <p className="text-xl text-gray-600 mb-8">
              Du må logga in for å se dine favoritter.
            </p>
            <button
              onClick={() => router.push('/auth')}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg transition-all"
            >
              Gå til innlogging
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">Mina Favoritter</h1>
          <p className="text-gray-600">Laster inn...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">Mina Favoritter</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Empty favorites
  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">Mina Favoritter</h1>
          <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md mx-auto">
            <p className="text-xl text-gray-600 mb-8">
              Du har ingen favoritter ennå.
            </p>
            <button
              onClick={() => router.push('/products')}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg transition-all"
            >
              Utforsk produkter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display favorites
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24">
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <h1 className="text-4xl font-bold mb-12 text-gray-800">Mina Favoritter</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,0.4fr))] gap-x-2 sm:gap-x-6 gap-y-10">
          {favorites.map((product, index) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              prefetch={true}
              className="group opacity-100 bg-white/80 rounded-xl overflow-hidden transition-all hover:scale-[1.02] flex flex-col aspect-[9/16]"
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <Image
                  src={product.images?.[0] || '/fallback.jpg'}
                  alt="Product preview"
                  fill
                  quality={40}
                  placeholder="blur"
                  blurDataURL={makeBlur()}
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>

              <div className="flex flex-col justify-between gap-2 text-sm bg-white px-3 py-4 rounded-b-md">
                <div className="flex justify-between items-center">
                  <div className="truncate text-sm">{product.name}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      saveFavourite(product.id, user).then((success) => {
                        if (success) {
                          // Remove from favorites list
                          setFavorites(prev => prev.filter(p => p.id !== product.id));
                        }
                      });
                    }}
                    className="text-pink-500 hover:text-pink-600 cursor-pointer text-lg"
                    title="Remove from favorites"
                  >
                    ❤️
                  </button>
                </div>
                <div className="flex justify-between items-center text-gray-900 font-semibold text-sm truncate">
                  <span className="text-gray-800 font-medium text-[clamp(0.875rem,2vw,1.125rem)]">
                    {product.price} NOK
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
