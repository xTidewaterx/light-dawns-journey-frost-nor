'use client';

import Link from 'next/link';
import { useAuth } from '../../auth/authContext';
import CartButton from '../../utils/cartButton';
import ImageCarousel from './ImageCarousel';

export default function ProductDetailView({ completeProduct, id }) {
  const { user } = useAuth();
  const canEditProduct = Boolean(user?.uid && completeProduct?.creatorId && user.uid === completeProduct.creatorId);
  const price = completeProduct.price ? (completeProduct.price / 100).toFixed(2) : "0.00";
  const currency = completeProduct.currency ? completeProduct.currency.toUpperCase() : "NOK";
  const colors = ["#4B2C20", "#E4C5B6"];
  const creator = completeProduct.artist || "Leonora Stensheim";

  return (
    <div className="grid grid-cols-1 gap-8 items-start lg:grid-cols-[1.6fr_1fr]">
      <div className="flex w-full flex-col gap-4 lg:max-w-[560px] xl:max-w-[600px]">
        <ImageCarousel images={completeProduct.images} productName={completeProduct.name} />
      </div>

      <div className="flex flex-col justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight mb-4">
            {completeProduct.name || 'Produktnavn'}
          </h1>
          {completeProduct.description ? (
            <p className="text-base leading-relaxed text-slate-600 whitespace-pre-wrap mb-4">
              {completeProduct.description}
            </p>
          ) : (
            <p className="text-sm text-slate-500 mb-4">Ingen beskrivelse er tilgjengelig for dette produktet.</p>
          )}
          <p className="text-2xl font-semibold text-emerald-800 mb-4">
            {price} {currency}
          </p>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-600">Farge:</div>
            <div className="flex items-center gap-2">
              {colors.map((color, idx) => (
                <span
                  key={idx}
                  className="w-8 h-8 rounded-full border border-slate-200"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="text-sm font-semibold text-slate-700 uppercase tracking-[0.12em] mb-2">Skaper</div>
          <div className="text-base text-slate-800 font-medium mb-6">{creator}</div>
        </div>

        <div className="space-y-3">
          <CartButton product={completeProduct} className="w-full" />
          {canEditProduct && (
            <Link
              href={`?edit=true`}
              className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              Rediger produkt
            </Link>
          )}
          <Link
            href="/products/cart"
            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Gå til handlekurv
          </Link>
          <div className="text-xs text-slate-500">
            Spesifikasjoner (klikk for utvidelse)
          </div>
        </div>
      </div>
    </div>
  );
}
