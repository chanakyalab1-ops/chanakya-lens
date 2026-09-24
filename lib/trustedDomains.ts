// Shared across candidate scoring (auto-generate.ts) and image selection
// (imageSelection.ts) so "trusted" means the same thing in both places.
export const TRUSTED_DOMAINS = new Set([
  "reuters.com", "wsj.com", "washingtonpost.com", "apnews.com", "bbc.com",
  "ft.com", "bloomberg.com", "economist.com", "nytimes.com", "cnn.com",
  "rferl.org", "aljazeera.com", "theguardian.com", "foreignpolicy.com",
  "foreignaffairs.com", "politico.com", "axios.com", "thehill.com",
  "scmp.com", "hindustantimes.com", "thehindu.com", "ndtv.com",
  "economictimes.indiatimes.com", "timesofindia.indiatimes.com",
  "jpost.com", "haaretz.com", "middleeasteye.net", "arabnews.com",
  "dawn.com", "thenews.com.pk", "dw.com", "euronews.com",
]);
