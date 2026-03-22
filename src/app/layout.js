import React from "react";
import {
  Geist,
  Geist_Mono,
  Roboto_Flex,
  Roboto,
  Playfair_Display,
  Cormorant_Garamond,
  Cinzel,
  Abril_Fatface,
  Lora,
  Great_Vibes,
  EB_Garamond,
  Libre_Baskerville,
  Oswald,
  Bebas_Neue,
  Manrope,
  Della_Respira,
  Raleway,
} from "next/font/google";

import "./globals.css";
import CartWrapper from './utils/cartWrapper';
import Navbar from "../app/components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./auth/authContext";
import '../app/styles/omoss.css';
import "../../src/app/globals.css";

// Existing fonts
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const robotoFlex = Roboto_Flex({ weight: ['400', '700'], subsets: ['latin'] });
const roboto = Roboto({ weight: ['400', '700'], subsets: ['latin'] });

// Luxurious fonts
const playfairDisplay = Playfair_Display({ variable: "--font-playfair", weight: ['400', '700'], subsets: ["latin"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", weight: ['400', '700'], subsets: ["latin"] });
const cinzel = Cinzel({ variable: "--font-cinzel", weight: ['400', '700'], subsets: ["latin"] });

// Abril Fatface only has weight 400
const abril = Abril_Fatface({ weight: ['400'], subsets: ["latin"] });

const lora = Lora({ variable: "--font-lora", weight: ['400', '700'], subsets: ["latin"] });
const greatVibes = Great_Vibes({ variable: "--font-greatvibes", weight: ['400'], subsets: ["latin"] });
const ebGaramond = EB_Garamond({ variable: "--font-ebgaramond", weight: ['400', '700'], subsets: ["latin"] });
const libreBaskerville = Libre_Baskerville({ variable: "--font-libre", weight: ['400', '700'], subsets: ["latin"] });

// Display fonts
const oswald = Oswald({ variable: "--font-oswald", weight: ['700'], subsets: ["latin"] });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas", weight: ['400'], subsets: ["latin"] });

// Modern fonts
const manrope = Manrope({ variable: "--font-manrope", weight: ['400', '700'], subsets: ["latin"] });

// Added elegant Claude-style combo
const dellaRespira = Della_Respira({ variable: "--font-dellarespira", weight: ['400'], subsets: ["latin"] });
const raleway = Raleway({ variable: "--font-raleway", weight: ['400', '700'], subsets: ["latin"] });

export const metadata = {
  title: "NORYA",
  description: "NORDNORSK HÅNDVERK",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen flex flex-col
          ${geistSans.variable} 
          ${geistMono.variable} 
          ${robotoFlex.variable} 
          ${roboto.variable} 
          ${playfairDisplay.variable} 
          ${cormorant.variable} 
          ${cinzel.variable} 
          ${abril.variable} 
          ${lora.variable} 
          ${greatVibes.variable} 
          ${ebGaramond.variable} 
          ${libreBaskerville.variable} 
          ${oswald.variable} 
          ${bebasNeue.variable} 
          ${manrope.variable}
          ${dellaRespira.variable}
          ${raleway.variable}
          antialiased`}
      >      <CartWrapper className="flex flex-col flex-grow">
        <AuthProvider>
    
            <Navbar />
            <div id="scroll-marker" className="h-[1px] w-full"></div>
            <main className="flex-grow">{children}</main>
            <Footer />
      
        </AuthProvider>
            </CartWrapper>
      </body>
    </html>
  );
}