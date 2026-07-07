import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";

import { SiteFooter } from "@/components/chrome/site-footer";
import { SiteHeader } from "@/components/chrome/site-header";
import { WhatsAppButton } from "@/components/chrome/whatsapp-button";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { localBusinessSchema } from "@/lib/seo";
import "./globals.css";

/* Same pairing as the live WordPress site (theme "patiotime"):
   Cormorant Garamond + Jost, for stylistic continuity across the merge. */
const uiSans = Jost({
  variable: "--font-ui-sans",
  subsets: ["latin"],
});

const editorialSerif = Cormorant_Garamond({
  variable: "--font-editorial-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
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
