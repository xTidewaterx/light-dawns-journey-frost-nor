'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#001f3f] text-white py-6 px-4 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding Section */}
        <Link href="/" className="flex items-center space-x-3 group">
          <img
            src="/norland-logo.png"
            alt="NORYA Logo"
            className="w-8 h-8 group-hover:invert transition duration-300"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[1.1rem] sm:text-[1.25rem] font-light tracking-wide text-yellow-400 group-hover:text-yellow-300 transition-colors">
              NORYA
            </span>
            <span className="text-xs text-gray-300 tracking-wide">
              Norsk kvalitet, fra Norge
            </span>
          </div>
        </Link>

        {/* Footer Navigation */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-light text-gray-300 tracking-wide">
          <Link href="/omoss" className="hover:text-yellow-400 transition-colors">Om Oss</Link>
          <Link href="/kontakt" className="hover:text-yellow-400 transition-colors">Kontakt</Link>
          <Link href="/personvern" className="hover:text-yellow-400 transition-colors">Personvern</Link>
          <Link href="/kjopsvilkar" className="hover:text-yellow-400 transition-colors">Kjøpsvilkår</Link>
          <Link href="/angrerett" className="hover:text-yellow-400 transition-colors">Angrerett</Link>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="mt-6 text-center text-xs text-gray-400 tracking-wide">
        © {new Date().getFullYear()} NORYA. Alle rettigheter forbeholdt.
      </div>
    </footer>
  );
}