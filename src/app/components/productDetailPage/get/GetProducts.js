"use client";

import { useEffect, useState } from 'react';
import { saveFavourite } from '../../../lib/saveFavourite';
import Image from 'next/image';
import { useAuth } from '../../../auth/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const mockProducts = [
  {
    id: 'prod_001',
    name: 'Arctic Beanie',
    price: 199,
    images: ['https://cdn.booniez.com/i/d/dale-of-norway-valle-sweater-bla-7868-f'],
  },
  {
    id: 'prod_002',
    name: 'Nordic Hoodie',
    price: 499,
    images: ['https://eu.daleofnorway.com/globalassets/dale-of-norway/produktbilder/81951-christiania-womens-jacket/81951_d00_life.jpg?mode=max&width=2000&height=2000'],
  },
  {
    id: 'prod_003',
    name: 'Midnight Jacket',
    price: 1299,
    images: ['https://www.produits-scandinaves.com/20716-large_default/trondheim-men-sweater-dale-of-norway.jpg'],
  },
  {
    id: 'prod_004',
    name: 'Fjord Backpack',
    price: 899,
    images: ['https://lh6.googleusercontent.com/proxy/rWFDLN3670M0-35y9mUM0AsA0MrU0SXYY5WUiCNQsJK7T09cf_XQsSc3G7tg2SWOC1iqIme2xJ_uAEKcM9M94EFa1vStW2Y8fNyVI7j-3HcXUFZP4HmJuAxEfqSjD38DntkJsUzxORNYpc4sNI1nyQrdM2H6FJFAzNPjED5aa5w_mQaM'],
  },
];

export default function GetProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('attempting to fetch products from Next.js API route...');
        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.data) {
          setProducts(json.data);
        } else {
          console.warn('No data returned, using mock products');
          setProducts(mockProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const placeholderCards = Array.from({ length: 4 }).map((_, idx) => (
    <div
      key={idx}
      style={{ animationDelay: `${idx * 75}ms` }}
      className="group animate-fadeInUp animation-fill-forwards bg-gray-100 rounded-xl overflow-hidden flex flex-col aspect-[9/16]"
    />
  ));

  const makeBlur = (color = '#e5e7eb') => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='100%' height='100%' fill='${color}'/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  return (
    <div className="w-full py-10">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-x-2 gap gap-y-10 pb-2">
        <div className="pt-0 mt-4 bg-white/80 px-3 sm:px-4 lg:px-6 sm:py-2 rounded-xl text-left text-[clamp(1.75rem,3vw,2.5rem)] text-gray-700">
          Produkter
        </div>
      </div>

      <div className="grid justify-center grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,0.4fr))] gap-x-2 sm:gap-x-6 gap-y-10 px-4">
        {loading
          ? placeholderCards
          : products.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                prefetch={true}
                className="group opacity-0 animate-fadeInUp animation-fill-forwards bg-white/80 rounded-xl overflow-hidden transition-all hover:scale-[1.02] flex flex-col aspect-[9/16]"
                style={{ animationDelay: `${index * 75}ms` }}
                onMouseEnter={() => {
                  // pre-load the main image for snappier navigation
                  const img = new window.Image();
                  img.src = product.images?.[0] || '/fallback.jpg';
                }}
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
                        e.stopPropagation(); // prevent bubbling to card navigation
                        saveFavourite(product.id, user);
                      }}
                      className="text-pink-500 hover:text-pink-600 cursor-pointer"
                    >
                      ❤️
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-gray-900 font-semibold text-sm truncate">
                    <span className="text-gray-800 font-medium text-[clamp(0.875rem,2vw,1.125rem)]">
                      {product.price} NOK
                    </span>
                    <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">Johan Myhre</div>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}