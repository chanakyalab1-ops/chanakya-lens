import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/review", "/review/", "/admin", "/admin/", "/account"],
    },
    sitemap: "https://chanakyalens.com/sitemap.xml",
  };
}
