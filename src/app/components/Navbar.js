'use client';

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHeart } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useCart } from "react-use-cart";

export default function Navbar() {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isProductDetailPage = pathname.startsWith("/products/") && pathname !== "/products";
  const [isOpen, setIsOpen] = useState(false);
  const [showNorya, setShowNorya] = useState(!isHomePage);
  const [logoSize, setLogoSize] = useState(36);
  const [textPaddingRight, setTextPaddingRight] = useState(8);
  const [hideNavbar, setHideNavbar] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const navbarRef = useRef(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const updateSizes = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setLogoSize(36);
        setTextPaddingRight(8);
      } else if (w < 1600) {
        setLogoSize(48);
        setTextPaddingRight(10);
      } else {
        setLogoSize(44);
        setTextPaddingRight(12);
      }
    };

    updateSizes();
    window.addEventListener("resize", updateSizes);
    return () => window.removeEventListener("resize", updateSizes);
  }, []);

  useEffect(() => {
    if (isHomePage) {
      setShowNorya(false);
      const timer = setTimeout(() => {
        setShowNorya(true);
      }, 3200);
      return () => clearTimeout(timer);
    } else {
      setShowNorya(true);
    }
  }, [isHomePage]);

  useEffect(() => {
    const marker = document.getElementById("scroll-marker");
    if (!marker) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isOpen) {
          setHideNavbar(false);
          return;
        }
        setHideNavbar(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    observer.observe(marker);

    return () => observer.disconnect();
  }, [isOpen, pathname]);

  return (
    <nav
      ref={navbarRef}
      className={`w-full z-50 text-white fixed top-0 left-0 transition-all duration-300 ease-out ${
        isProductDetailPage ? "pt-2 bg-white/88 backdrop-blur-md" : "bg-transparent pt-4"
      } ${
        hideNavbar ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="max-w-9xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="group relative flex items-center m-0 no-underline hover:no-underline">
            <span className="absolute left-0 top-0 h-full w-full bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:w-[130%] transition-[opacity,width] duration-300 ease-out -z-10" />
            <div
              className="relative flex items-center justify-center z-10"
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
              }}
            >
              <img
                id="navbarLogo"
                className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                src="/NORYA-logo.png"
                alt="NORYA Logo"
              />
            </div>
            <span
              id="navbarTextTarget"
              className={`text-2xl pl-2 font tracking-tight z-10 transition-opacity duration-[1400ms] ease-in-out ${
                showNorya ? "opacity-100" : "opacity-0 pr-6"
              } ${!isHomePage ? "text-gray-700" : ""}`}
              style={{
                lineHeight: `${logoSize}px`,
                display: showNorya ? "inline-block" : "none",
                verticalAlign: "middle",
                transformOrigin: "left center",
              }}
            >
              NORYA
            </span>
          </Link>

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden z-50 relative focus:outline-none"
            aria-label="Toggle Menu"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${isHomePage ? "text-white" : "text-slate-800"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="hidden md:flex items-center space-x-6 h-full m-0 flex-nowrap">
            {[
              { href: "/sellers", label: "Skapere" },
            ].map((item) => (
 <div className={pathname !== '/' ? 'text-black hover:text-black' : 'text-white hover:text-white'} key={item.label}>

                <Link
                  href={item.href}
                  className={`whitespace-nowrap px-4 py-1 transition-all rounded-full hover:bg-yellow-400 no-underline hover:no-underline ${
                    isHomePage ? "text-white hover:text-black" : "text-slate-800 hover:text-black"
                  } ${item.extra || ""}`}
                >
                  {item.label}
                </Link>
              </div>
            ))}

            <Link
              href="/favorites"
              className="hover:bg-yellow-400 rounded-full px-4 py-1 group transition-all flex items-center justify-center no-underline hover:no-underline"
            >
              <FontAwesomeIcon className={pathname !== '/' ? 'invert group-hover:invert text-white' : 'group-hover:invert text-white'} icon={faHeart} />
            </Link>

            <Link
              href="/products/cart"
              className="relative hover:bg-yellow-400 hover:text-black rounded-full px-4 py-1 group transition-all flex items-center justify-center no-underline hover:no-underline"
            >
              <img
                className={pathname !== '/' ? 'invert w-5 min-w-[20px] min-h-[20px] ' : 'w-5 min-w-[20px] min-h-[20px] '}
                src="/shoppingCartIconWhite.png"
                alt="Cart"
              />
              {hasMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center font-semibold">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link
              href="/profile"
              className="group hover:bg-yellow-400 rounded-full px-4 py-1 transition-all no-underline hover:no-underline"
            >
              <FontAwesomeIcon className= {pathname !== '/' ? 'invert group-hover:invert text-white' : 'group-hover:invert text-white'} icon={faUser} />
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`fixed top-0 left-0 w-full h-screen bg-blue-900 z-40 flex flex-col items-center text-white overflow-y-auto transition-all duration-500 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex flex-col items-center justify-center mt-12 mb-16 transition-all duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <img className="w-12 h-12 mb-6" src="/NORYA-logo.png" alt="NORYA Logo" />
          <span className="text-3xl font-semibold tracking-tight">NORYA</span>
        </div>

        <div
          className={`flex flex-col space-y-4 text-center transition-all duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          {[
            { href: "/sellers", label: "Skapere" },
            {
              href: "/favorites",
              label: <FontAwesomeIcon icon={faHeart} className="text-2xl" />,
            },
            {
              href: "/products/cart",
              label: (
                <span className="relative inline-flex">
                  <img
                    className="w-6 inline-block align-middle"
                    src="/shoppingCartIconWhite.png"
                    alt="Cart"
                  />
                  {hasMounted && totalItems > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center font-semibold">
                      {totalItems}
                    </span>
                  )}
                </span>
              ),
            },
            { href: "/profile", label: <FontAwesomeIcon icon={faUser} className="text-2xl" /> },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white text-xl py-2 transition-all flex justify-center no-underline hover:no-underline"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      {/* ... your existing navbar content ... */}
    </nav>
  );
}


