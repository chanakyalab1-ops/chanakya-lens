import type { Metadata, Viewport } from "next";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import StickyDigestBar from "@/components/StickyDigestBar";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { Barlow_Condensed, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
export const metadata: Metadata = {
  title: "Chanakya Lens -- stay ahead of the map",
  description: "Geopolitics traced to you. Small events, real chains, plausible impact -- not forecasts.",
  icons: {
    icon: "/logo-mark.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
const JSON_LD = JSON.stringify([
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Chanakya Lens",
    "url": "https://chanakyalens.com",
    "logo": "https://chanakyalens.com/favicon.ico",
    "description": "Geopolitics traced to you. Global moves. Local math.",
    "sameAs": [
      "https://www.instagram.com/chanakya.lab",
      "https://www.youtube.com/@chanakya_lab",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Chanakya Lens",
    "url": "https://chanakyalens.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://chanakyalens.com/?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  },
]);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
        <Footer />
        <StickyDigestBar />
        <MobileTabBar />
      </body>
    </html>
  );
}
