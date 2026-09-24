import type { Metadata } from "next";
import Footer from "@/components/Footer";
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
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
        <Footer />
        <StickyDigestBar />
      </body>
    </html>
  );
}
