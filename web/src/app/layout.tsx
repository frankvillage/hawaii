import type { Metadata } from "next";
import localFont from "next/font/local";

import { SiteFooter } from "@/components/chrome/site-footer";
import { SiteHeader } from "@/components/chrome/site-header";
import { WhatsAppButton } from "@/components/chrome/whatsapp-button";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { localBusinessSchema } from "@/lib/seo";
import "./globals.css";

/* Same pairing as the live WordPress site (theme "patiotime"):
   Cormorant Garamond + Jost, for stylistic continuity across the merge. */
const uiSans = localFont({
  variable: "--font-ui-sans",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
  src: [
    {
      path: "./fonts/jost-latin-variable.woff2",
      style: "normal",
      weight: "100 900",
    },
  ],
});

const editorialSerif = localFont({
  variable: "--font-editorial-serif",
  display: "swap",
  fallback: ["Times New Roman", "serif"],
  src: [
    {
      path: "./fonts/cormorant-garamond-latin-variable.woff2",
      style: "normal",
      weight: "400 700",
    },
    {
      path: "./fonts/cormorant-garamond-latin-italic-variable.woff2",
      style: "italic",
      weight: "400 700",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hawaiipescara.it"),
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
      className={`${uiSans.variable} ${editorialSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0c0d] text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
        />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <WhatsAppButton />
        <CookieBanner />
      </body>
    </html>
  );
}
