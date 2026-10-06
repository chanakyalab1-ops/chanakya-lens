import type { Metadata, Viewport } from "next";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import StickyDigestBar from "@/components/StickyDigestBar";
import Script from "next/script";
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
const SITE_TITLE = "Chanakya Lens -- stay ahead of the map";
const SITE_DESCRIPTION = "Geopolitics traced to you. Small events, real chains, plausible impact -- not forecasts.";

export const metadata: Metadata = {
  metadataBase: new URL("https://chanakyalens.com"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  // Every page names itself as its own canonical URL, so search engines
  // don't treat ?q= and other query variants as separate pages.
  alternates: { canonical: "./", types: { "application/rss+xml": "/rss.xml" } },
  // Pages that set their own openGraph (stories) override these.
  openGraph: {
    type: "website",
    siteName: "Chanakya Lens",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in Vercel to the code Google
  // Search Console gives you; nothing is rendered until it is set.
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
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
    "logo": "https://chanakyalens.com/logo-mark.png",
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
        {/* Vercel Web Analytics, loaded directly so it needs no npm package.
            It only reports once Web Analytics is turned on for the project in
            the Vercel dashboard; until then the script 404s harmlessly. */}
        <Script id="vercel-analytics-init" strategy="afterInteractive">
          {`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}
        </Script>
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
