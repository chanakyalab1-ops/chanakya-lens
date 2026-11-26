import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browsers and crawlers ask for /favicon.ico by default; the site's icon is
  // /logo-mark.png, so send them there instead of returning a 404 (Search
  // Console flagged the 404).
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/logo-mark.png", permanent: true },
      // Lens Monthly was first called Dispatches.
      { source: "/dispatches", destination: "/monthly", permanent: true },
      { source: "/dispatches/:slug", destination: "/monthly/:slug", permanent: true },
      { source: "/admin/dispatches", destination: "/admin/monthly", permanent: true },
    ];
  },
  // Basic hardening headers. No Content-Security-Policy yet: Paddle's checkout and
  // the site's inline scripts need a carefully tested policy first.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;
