import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browsers and crawlers ask for /favicon.ico by default; the site's icon is
  // /logo-mark.png, so send them there instead of returning a 404 (Search
  // Console flagged the 404).
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/logo-mark.png", permanent: true }];
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
