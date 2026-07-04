import type { Metadata } from "next";
import { Archivo, Oswald, Playfair_Display } from "next/font/google";

import { SiteFooter } from "@/components/chrome/site-footer";
import { SiteHeader } from "@/components/chrome/site-header";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { localBusinessSchema } from "@/lib/seo";
import "./globals.css";

const uiSans = Archivo({
  variable: "--font-ui-sans",
  subsets: ["latin"],
});

const editorialSerif = Playfair_Display({
  variable: "--font-editorial-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const displayCondensed = Oswald({
  variable: "--font-display-cond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Hawaii Pescara | Urban Village",
    template: "%s",
  },
  description:
    "Beach, ristorante di mare, terrazza serale, sport, eventi e feste private sul lungomare di Pescara.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${uiSans.variable} ${editorialSerif.variable} ${displayCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#07111a] text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
        />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
