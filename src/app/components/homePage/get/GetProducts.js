'use client';

import { useEffect, useMemo, useState } from 'react';
import { saveFavourite, isFavourited } from '../../../lib/saveFavourite';
import Image from 'next/image';
import { useAuth } from '../../../auth/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart } from 'lucide-react';

const mockProducts = [
  {
    id: 'prod_001',
    name: 'Arctic Beanie',
    price: 199,
    currency: 'NOK',
    creatorId: null,
    creatorName: 'NORYA skaper',
    images: ['https://cdn.booniez.com/i/d/dale-of-norway-valle-sweater-bla-7868-f'],
  },
  {
    id: 'prod_002',
    name: 'Nordic Hoodie',
    price: 499,
    currency: 'NOK',
    creatorId: null,
    creatorName: 'NORYA skaper',
    images: ['https://eu.daleofnorway.com/globalassets/dale-of-norway/produktbilder/81951-christiania-womens-jacket/81951_d00_life.jpg?mode=max&width=2000&height=2000'],
  },
  {
    id: 'prod_003',
    name: 'Midnight Jacket',
    price: 1299,
    currency: 'NOK',
    creatorId: null,
    creatorName: 'NORYA skaper',
    images: ['https://www.produits-scandinaves.com/20716-large_default/trondheim-men-sweater-dale-of-norway.jpg'],
  },
  {
    id: 'prod_004',
    name: 'Fjord Backpack',
    price: 899,
    currency: 'NOK',
    creatorId: null,
    creatorName: 'NORYA skaper',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80'],
  },
  {
    id: 'prod_005',
    name: 'Lofoten Wool Scarf',
    price: 749,
    currency: 'NOK',
    creatorId: null,
    creatorName: 'NORYA skaper',
    images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=1200&q=80'],
  },
  {
    id: 'prod_006',
    name: 'Northern Utility Tote',
    price: 560,
    currency: 'NOK',
    creatorId: null,
    creatorName: 'NORYA skaper',
    images: ['https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80'],
  },
];

export default function GetProducts({ variant = 'home' }) {
  const isProductsPage = variant === 'products-page';
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [favouritesByProduct, setFavouritesByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [activeCollection, setActiveCollection] = useState('all');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const json = await res.json();

        if (json.data && json.data.length > 0) {
          const safeProducts = json.data.map((p) => ({
            id: p.id,
            name: p.name || 'Unnamed product',
            images: p.images?.length ? p.images : ['/fallback.jpg'],
            price: p.price ?? 0,
            currency: p.currency ?? 'NOK',
            creatorId: p.metadata?.creatorId || null,
            creatorName: p.metadata?.creatorName || p.metadata?.creator || null,
          }));

          setProducts(safeProducts);
        } else {
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

  useEffect(() => {
    let cancelled = false;

    async function fetchFavouriteStatuses() {
      if (!user?.uid || products.length === 0) {
        setFavouritesByProduct({});
        return;
      }

      const entries = await Promise.all(
        products.map(async (product) => {
          const favourited = await isFavourited(product.id, user);
          return [product.id, favourited];
        })
      );

      if (!cancelled) {
        setFavouritesByProduct(Object.fromEntries(entries));
      }
    }

    fetchFavouriteStatuses();

    return () => {
      cancelled = true;
    };
  }, [products, user]);

  const creatorCollections = useMemo(() => {
    const uniqueCreators = Array.from(
      new Set(products.map((product) => product.creatorName).filter(Boolean))
    ).slice(0, 2);

    return uniqueCreators.map((creatorName, index) => ({
      id: `creator-${index}`,
      label: `Fra ${creatorName}`,
      predicate: (product) => product.creatorName === creatorName,
    }));
  }, [products]);

  const collectionOptions = useMemo(
    () => [
      { id: 'all', label: 'Alle produkter', predicate: () => true },
      {
        id: 'new',
        label: 'Nyheter',
        predicate: (product) => products.slice(0, 12).some((item) => item.id === product.id),
      },
      {
        id: 'curated',
        label: 'Utvalgt av NORYA',
        predicate: (product, index) => index % 2 === 0,
      },
      {
        id: 'under-1000',
        label: 'Under 1000 kr',
        predicate: (product) => Number(product.price) < 1000,
      },
      ...creatorCollections,
    ],
    [creatorCollections, products]
  );

  const filteredProducts = useMemo(() => {
    const selectedCollection = collectionOptions.find((option) => option.id === activeCollection);

    const collectionFiltered = products.filter((product, index) => {
      if (!selectedCollection) return true;
      return selectedCollection.predicate(product, index);
    });

    const searchFiltered = collectionFiltered.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    const base = searchFiltered;

    if (sortBy === 'price-asc') {
      return [...base].sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortBy === 'price-desc') {
      return [...base].sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (sortBy === 'name') {
      return [...base].sort((a, b) => a.name.localeCompare(b.name, 'no'));
    }

    return base;
  }, [products, searchTerm, sortBy, activeCollection, collectionOptions]);

  const visibleProducts = isProductsPage ? filteredProducts : filteredProducts.slice(0, 4);

  const placeholdersCount = isProductsPage ? 8 : 4;
  const placeholderCards = Array.from({ length: placeholdersCount }).map((_, idx) => (
    <div
      key={idx}
      style={{ animationDelay: `${idx * 65}ms` }}
      className={`group animate-fadeInUp animation-fill-forwards overflow-hidden ${
        isProductsPage
          ? 'rounded-3xl border border-slate-200 bg-slate-100/80 aspect-[4/5]'
          : 'bg-gray-100 rounded-xl aspect-[9/16]'
      }`}
    />
  ));

  return (
    <div
      className={`w-full ${
        isProductsPage
          ? 'pb-16'
          : 'pt-10 pb-14 sm:pb-16'
      }`}
    >
      {isProductsPage ? (
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-[#f5f8fb] via-white to-[#e9f1f8] px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#bfd7ec]/40 blur-2xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-[#dceaf6]/60 blur-3xl" />

          <p className="relative text-xs uppercase tracking-[0.28em] text-slate-500">NORYA Collection</p>
          <h1 className="relative mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Håndplukket design fra nordnorske skapere
          </h1>
          <p className="relative mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Oppdag internasjonal kvalitetsfølelse med lokal identitet. Utvalgte produkter med historie,
            små opplag og materialer laget for å vare.
          </p>

          <div className="relative mt-6 flex flex-wrap gap-2">
            {collectionOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveCollection(option.id)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  activeCollection === option.id
                    ? 'border border-slate-900 bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white/85 text-slate-700 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative mt-4 grid gap-3 md:grid-cols-[auto_auto_auto] md:justify-start">
            <button
              type="button"
              onClick={() => setShowSearch((prev) => !prev)}
              className="rounded-2xl border border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:text-slate-900"
            >
              {showSearch ? 'Skjul søk' : 'Søk'}
            </button>

            {showSearch && (
              <label className="flex items-center rounded-2xl border border-slate-300/80 bg-white/80 px-4 py-2 shadow-sm">
                <input
                  type="text"
                  placeholder="Søk produktnavn"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none"
                />
              </label>
            )}

            <label className="rounded-2xl border border-slate-300/80 bg-white/80 px-3 py-2 shadow-sm">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-full bg-transparent text-sm text-slate-700 focus:outline-none"
              >
                <option value="featured">Utvalgt</option>
                <option value="price-asc">Pris: lav til høy</option>
                <option value="price-desc">Pris: høy til lav</option>
                <option value="name">Navn A-Å</option>
              </select>
            </label>

            <div className="inline-flex items-center justify-center rounded-2xl border border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              {visibleProducts.length} produkter
            </div>
          </div>
        </section>
      ) : (
        <div className="flex items-end justify-between gap-4 px-4 sm:px-4 lg:px-6 pb-2">
          <div className="pt-0 mt-4 px-3 sm:px-4 lg:px-6 sm:py-3 text-left">
            <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] text-[#0a1f44] tracking-tight leading-tight">
              Utvalgte produkter
            </h2>
            <p className="text-sm sm:text-base text-[#1f355f] mt-1">
              Håndplukket fra nordnorske skaperprofiler.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden sm:inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:border-slate-400 transition-colors"
          >
            Se alle produkter
          </Link>
        </div>
      )}

      <div
        className={`mt-6 grid ${
          isProductsPage
            ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-7'
            : 'grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-2 sm:gap-x-6 gap-y-10'
        } px-4 ${isProductsPage ? 'sm:px-8 lg:px-10' : ''}`}
      >
        {loading
          ? placeholderCards
          : visibleProducts.map((product, index) => {
              const isFavourite = Boolean(favouritesByProduct[product.id]);

              return (
                <article
                  key={product.id}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className={`group opacity-0 animate-fadeInUp animation-fill-forwards overflow-hidden transition-all duration-300 cursor-pointer ${
                    isProductsPage
                      ? 'rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.14)]'
                      : 'bg-white/80 rounded-xl hover:scale-[1.02] flex flex-col aspect-[9/16]'
                  }`}
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <div className={`relative w-full overflow-hidden ${isProductsPage ? 'aspect-[4/5]' : 'h-full rounded-xl'}`}>
                    <Image
                      src={product.images?.[0] || '/fallback.jpg'}
                      alt={product.name || 'Product preview'}
                      fill
                      quality={45}
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      className="transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div
                    className={`flex flex-col justify-between gap-2 ${
                      isProductsPage ? 'px-4 py-4 sm:px-5 sm:py-5' : 'text-sm bg-white px-3 py-4 rounded-b-md'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className={`truncate ${isProductsPage ? 'text-base font-medium text-slate-900' : 'text-sm'}`}>
                        {product.name}
                      </div>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!user) {
                            router.push('/profile');
                            return;
                          }

                          const success = await saveFavourite(product.id, user);
                          if (success) {
                            setFavouritesByProduct((previous) => ({
                              ...previous,
                              [product.id]: !Boolean(previous[product.id]),
                            }));
                          }
                        }}
                        aria-label={isFavourite ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
                        aria-pressed={isFavourite}
                        title={isFavourite ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70 ${
                          isFavourite
                            ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50/80 hover:shadow-[0_0_0_6px_rgba(244,63,94,0.14)]'
                            : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100/80 hover:shadow-[0_0_0_6px_rgba(148,163,184,0.2)]'
                        }`}
                      >
                        <Heart
                          className={`h-5 w-5 transition-transform duration-300 ${
                            isFavourite ? 'scale-100' : 'scale-95'
                          }`}
                          fill={isFavourite ? 'currentColor' : 'none'}
                          strokeWidth={2}
                        />
                      </button>
                    </div>

                    <div className={`flex justify-between items-center gap-3 ${isProductsPage ? 'pt-1' : 'text-gray-900 font-semibold text-sm truncate'}`}>
                      <span className={`${isProductsPage ? 'text-slate-900 font-semibold text-base' : 'text-gray-800 font-medium text-[clamp(0.875rem,2vw,1.125rem)]'}`}>
                        {Number(product.price).toLocaleString('no-NO')} {product.currency || 'NOK'}
                      </span>

                      {product.creatorId ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/profile/${product.creatorId}`);
                          }}
                          className="text-xs text-gray-600 whitespace-nowrap underline underline-offset-2 hover:text-slate-900 transition-colors"
                        >
                          {product.creatorName || 'Se skaper'}
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {product.creatorName || 'Fra NORYA'}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
      </div>

      {!loading && isProductsPage && visibleProducts.length === 0 && (
        <div className="mx-4 mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 sm:mx-8 lg:mx-10">
          Ingen produkter matcher søket ditt ennå. Prøv et annet søk eller filter.
        </div>
      )}
    </div>
  );
}
