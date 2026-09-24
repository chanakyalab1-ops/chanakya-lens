// Hosts registered in next.config.ts's images.remotePatterns -- next/image
// can resize/optimize these. Everything else (source-article og:image URLs,
// which can come from any news domain) has to skip optimization since we
// can't pre-register every possible publisher.
const OPTIMIZABLE_HOSTS = new Set(["images.pexels.com", "upload.wikimedia.org"]);

export function isOptimizableImageUrl(url: string): boolean {
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}
