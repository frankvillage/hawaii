import type { Metadata } from "next";
import { Archivo, Prata } from "next/font/google";

import { SiteFooter } from "@/components/chrome/site-footer";
import { SiteHeader } from "@/components/chrome/site-header";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { localBusinessSchema } from "@/lib/seo";
import "./globals.css";

const uiSans = Archivo({
  variable: "--font-ui-sans",
  subsets: ["latin"],
});

/* Prata: high-contrast didone, the closest voice to the Hawaii wordmark.
   Single 400 weight by design — display use only. */
const editorialSerif = Prata({
  variable: "--font-editorial-serif",
  subsets: ["latin"],
  weight: "400",
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
        <CookieBanner />
      </body>
    </html>
  );
}
