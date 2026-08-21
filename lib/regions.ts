import { Story } from "./stories";

export const REGIONS = ["Asia", "Americas", "Europe", "Middle East", "Africa"] as const;
export type Region = (typeof REGIONS)[number] | "International";

// Maps country names as they appear in source_country data to a region.
// Extend this list as new source countries show up in practice.
const COUNTRY_TO_REGION: Record<string, Region> = {
  // Asia
  "China": "Asia", "Japan": "Asia", "India": "Asia", "South Korea": "Asia",
  "North Korea": "Asia", "Taiwan": "Asia", "Indonesia": "Asia", "Vietnam": "Asia",
  "Philippines": "Asia", "Thailand": "Asia", "Pakistan": "Asia", "Bangladesh": "Asia",
  "Malaysia": "Asia", "Singapore": "Asia",

  // Americas
  "United States": "Americas", "Canada": "Americas", "Mexico": "Americas",
  "Brazil": "Americas", "Argentina": "Americas", "Colombia": "Americas",
  "Chile": "Americas", "Peru": "Americas", "Venezuela": "Americas", "Cuba": "Americas",

  // Europe
  "United Kingdom": "Europe", "Germany": "Europe", "France": "Europe", "Italy": "Europe",
  "Spain": "Europe", "Poland": "Europe", "Netherlands": "Europe", "Greece": "Europe",
  "Croatia": "Europe", "Ukraine": "Europe", "Russia": "Europe", "Sweden": "Europe",
  "Denmark": "Europe", "Norway": "Europe", "Belgium": "Europe", "Ireland": "Europe",
  "Portugal": "Europe", "Austria": "Europe", "Switzerland": "Europe",

  // Middle East
  "Israel": "Middle East", "Iran": "Middle East", "Saudi Arabia": "Middle East",
  "Iraq": "Middle East", "Turkey": "Middle East", "UAE": "Middle East",
  "Qatar": "Middle East", "Jordan": "Middle East", "Lebanon": "Middle East",
  "Syria": "Middle East", "Yemen": "Middle East", "Oman": "Middle East",

  // Africa
  "Morocco": "Africa", "South Africa": "Africa", "Nigeria": "Africa", "Egypt": "Africa",
  "Kenya": "Africa", "Ethiopia": "Africa", "Algeria": "Africa", "Ghana": "Africa",
  "Somalia": "Africa",
};

// Infers a story's region from its sources' countries. If sources span
// more than one region (or there's no usable country data), the story
// is tagged "International" rather than guessing.
export function inferStoryRegion(story: Story): Region {
  const countries = (story.sources ?? [])
    .map((s) => s.sourceCountry)
    .filter((c): c is string => !!c);

  if (countries.length === 0) return "International";

  const regions = new Set(
    countries.map((c) => COUNTRY_TO_REGION[c]).filter((r): r is Region => !!r)
  );

  if (regions.size === 1) {
    return [...regions][0];
  }

  return "International";
}