import { Story } from "./stories";

export const REGIONS = ["Asia", "Americas", "Europe", "Middle East", "Africa"] as const;
export type Region = (typeof REGIONS)[number] | "International";

// Maps country names to a region. Extend this list as new countries show up in practice.
const COUNTRY_TO_REGION: Record<string, Region> = {
  // Asia
  "China": "Asia", "Japan": "Asia", "India": "Asia", "South Korea": "Asia",
  "North Korea": "Asia", "Taiwan": "Asia", "Indonesia": "Asia", "Vietnam": "Asia",
  "Philippines": "Asia", "Thailand": "Asia", "Pakistan": "Asia", "Bangladesh": "Asia",
  "Malaysia": "Asia", "Singapore": "Asia", "Afghanistan": "Asia", "Myanmar": "Asia",
  "Kazakhstan": "Asia", "Uzbekistan": "Asia",

  // Americas
  "United States": "Americas", "Canada": "Americas", "Mexico": "Americas",
  "Brazil": "Americas", "Argentina": "Americas", "Colombia": "Americas",
  "Chile": "Americas", "Peru": "Americas", "Venezuela": "Americas", "Cuba": "Americas",

  // Europe
  "United Kingdom": "Europe", "Germany": "Europe", "France": "Europe", "Italy": "Europe",
  "Spain": "Europe", "Poland": "Europe", "Netherlands": "Europe", "Greece": "Europe",
  "Croatia": "Europe", "Ukraine": "Europe", "Russia": "Europe", "Sweden": "Europe",
  "Denmark": "Europe", "Norway": "Europe", "Belgium": "Europe", "Ireland": "Europe",
  "Portugal": "Europe", "Austria": "Europe", "Switzerland": "Europe", "Finland": "Europe",
  "Estonia": "Europe", "Belarus": "Europe",

  // Middle East
  "Israel": "Middle East", "Iran": "Middle East", "Saudi Arabia": "Middle East",
  "Iraq": "Middle East", "Turkey": "Middle East", "UAE": "Middle East",
  "Qatar": "Middle East", "Jordan": "Middle East", "Lebanon": "Middle East",
  "Syria": "Middle East", "Yemen": "Middle East", "Oman": "Middle East", "Kuwait": "Middle East",

  // Africa
  "Morocco": "Africa", "South Africa": "Africa", "Nigeria": "Africa", "Egypt": "Africa",
  "Kenya": "Africa", "Ethiopia": "Africa", "Algeria": "Africa", "Ghana": "Africa",
  "Somalia": "Africa",
};

function regionFromCountryNames(countries: string[]): Region {
  const regions = new Set(
    countries.map((c) => COUNTRY_TO_REGION[c]).filter((r): r is Region => !!r)
  );
  if (regions.size === 1) {
    return [...regions][0];
  }
  return "International";
}

// Infers a story's region. Prefers subjectCountries (what the story is
// actually ABOUT, set by the AI during generation) over sources' countries
// (who reported it), since those can differ or -- with some ingestion
// providers -- be empty entirely. Falls back to sources for older stories
// generated before subjectCountries existed.
export function inferStoryRegion(story: Story): Region {
  if (story.subjectCountries && story.subjectCountries.length > 0) {
    return regionFromCountryNames(story.subjectCountries);
  }

  const sourceCountries = (story.sources ?? [])
    .map((s) => s.sourceCountry)
    .filter((c): c is string => !!c);

  if (sourceCountries.length === 0) return "International";

  return regionFromCountryNames(sourceCountries);
}
