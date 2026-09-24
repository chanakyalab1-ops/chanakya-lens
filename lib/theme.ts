// Shared theme logic used by both the mobile switch (ThemeToggle) and the
// desktop segmented control (ThemeSegmentedControl), so "auto" resolution
// and system-preference tracking only exist in one place.

export type ThemePreference = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

export function getStoredPreference(): ThemePreference {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t === "light" || t === "dark" || t === "auto") return t;
  } catch {}
  return "auto";
}

function systemPrefersLight(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "light" || pref === "dark") return pref;
  return systemPrefersLight() ? "light" : "dark";
}

export function applyTheme(pref: ThemePreference) {
  if (resolveTheme(pref) === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function setThemePreference(pref: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {}
  applyTheme(pref);
  window.dispatchEvent(new Event("themechange"));
}

// Blocking script for the root layout's <head> -- applies the resolved
// theme before first paint so there's no flash of the wrong theme,
// including for "auto" (new visitors default to system preference).
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var light;if(t==="light"||t==="dark"){light=t==="light";}else{light=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches;}if(light){document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`;

let mediaListenerAttached = false;

// Re-applies the theme live if the OS preference changes while the page is
// open and the user's choice is "auto" -- attached once, lazily, on first
// subscribe from either theme component.
function ensureMediaListener() {
  if (mediaListenerAttached || typeof window === "undefined" || !window.matchMedia) return;
  mediaListenerAttached = true;
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (getStoredPreference() === "auto") {
      applyTheme("auto");
      window.dispatchEvent(new Event("themechange"));
    }
  });
}

export function subscribeTheme(callback: () => void) {
  ensureMediaListener();
  window.addEventListener("themechange", callback);
  return () => window.removeEventListener("themechange", callback);
}
