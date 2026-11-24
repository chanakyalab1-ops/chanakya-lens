import type { MetadataRoute } from "next";

// Makes the site installable ("Add to Home Screen"). No service worker: the
// site works online as normal and nothing is cached offline.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chanakya Lens",
    short_name: "Chanakya Lens",
    description: "Geopolitics traced to what it means for you. Daily stories, Off-Lens coverage maps and a daily digest.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0A112A",
    theme_color: "#0A112A",
    categories: ["news"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
