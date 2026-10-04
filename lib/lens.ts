import type { Story } from "./stories";
import { COUNTRY_NAMES, REGIONS } from "./regions";
import { inferStoryRegion } from "./regions";
import { slugify } from "./slug";

export type LensKind = "system" | "actor" | "country" | "theme";

export type LensEntity = {
  slug: string;
  name: string;
  kind: LensKind;
  tagline: string;
  // Words that mark a story as being about this entity (headline + summary).
  keywords: string[];
  // Plain, evergreen background. Countries have none and show coverage only.
  primer?: string[];
  // Why a reader in India should care.
  whyIndia?: string;
  related?: string[];
};

// Strategic systems: places and supply chains whose disruption spreads.
export const SYSTEMS: LensEntity[] = [
  {
    slug: "strait-of-hormuz",
    name: "Strait of Hormuz",
    kind: "system",
    tagline: "The one sea exit from the Gulf for most of its oil and gas.",
    keywords: ["Hormuz"],
    primer: [
      "The Strait of Hormuz is a narrow waterway between Iran and Oman that connects the Persian Gulf to the Gulf of Oman and the Arabian Sea. For most of the Gulf's oil and liquefied natural gas it is the only way out by sea.",
      "Roughly a fifth of the world's oil consumption passes through it. At its narrowest the strait is about 33 km wide, and the shipping lanes in each direction are only a few kilometres across, which is why a mine, a seizure or a threat can slow traffic quickly.",
    ],
    whyIndia:
      "India imports most of the crude oil it uses, and much of that, along with a large share of its LPG and LNG, comes from Gulf producers whose cargoes leave through the strait. Disruption here shows up in fuel prices, shipping insurance and the rupee.",
    related: ["iran", "irgc", "opec", "trade-corridors"],
  },
  {
    slug: "red-sea",
    name: "Red Sea and Bab el-Mandeb",
    kind: "system",
    tagline: "The shortest sea route between Asia and Europe.",
    keywords: ["Red Sea", "Bab el-Mandeb", "Suez"],
    primer: [
      "The Red Sea links the Suez Canal in the north to the Bab el-Mandeb strait in the south, which opens onto the Gulf of Aden and the Indian Ocean. It is the shortest sea route between Asia and Europe.",
      "The Suez Canal alone is commonly estimated to carry around 12% of world trade by volume. When attacks on ships made the route unsafe, many carriers switched to the long way round the Cape of Good Hope, which adds days and cost to every voyage.",
    ],
    whyIndia:
      "Indian exports to Europe and the Mediterranean, and energy cargoes heading west, use this route. When ships divert, freight rates and delivery times rise for Indian exporters and importers.",
    related: ["houthis", "egypt", "yemen", "trade-corridors"],
  },
  {
    slug: "taiwan-strait",
    name: "Taiwan and the Strait",
    kind: "system",
    tagline: "A contested island, a busy sea lane and the centre of the chip trade.",
    keywords: ["Taiwan Strait", "Taiwan"],
    primer: [
      "Taiwan is a self-governed island of about 23 million people off China's south-east coast. Beijing claims it as part of China and has not ruled out using force to unify it. The United States has no formal diplomatic ties with Taipei but keeps unofficial relations and sells it weapons under the Taiwan Relations Act.",
      "The Taiwan Strait, about 130 km wide at its narrowest, is one of the busiest shipping lanes in the world. Taiwan is also home to the factories that make most of the world's most advanced semiconductors.",
    ],
    whyIndia:
      "A crisis here would disrupt chip and electronics supply, and shipping and trade through East Asia, both of which Indian industry depends on.",
    related: ["semiconductors", "china", "taiwan", "quad"],
  },
  {
    slug: "semiconductors",
    name: "Semiconductors",
    kind: "system",
    tagline: "Few places can do each step, so one break spreads everywhere.",
    keywords: ["semiconductor", "semiconductors", "chipmaker", "chipmakers", "TSMC", "ASML", "Nvidia", "microchip", "wafer"],
    primer: [
      "Chips pass through a long chain. Design is led by US firms; the machines that print the most advanced chips come from the Netherlands, Japan and the United States, and one Dutch company, ASML, is the only maker of the most advanced lithography machines. Fabrication of leading-edge chips is concentrated in Taiwan, with South Korea next; assembly, packaging and testing happen mostly across Asia.",
      "Because only a handful of firms and places can do each step, export controls, tariffs, or a disruption at one point carry through the whole chain.",
    ],
    whyIndia:
      "India is building chip fabrication and packaging plants under its Semiconductor Mission, and its electronics and auto industries import chips. Export controls and supply shocks hit both.",
    related: ["taiwan-strait", "china", "united-states", "south-korea"],
  },
  {
    slug: "trade-corridors",
    name: "Trade corridors",
    kind: "system",
    tagline: "The routes and deals that decide how goods move, and what can be bypassed.",
    keywords: ["trade corridor", "economic corridor", "IMEC", "INSTC", "North-South Transport Corridor", "Belt and Road", "Northern Sea Route", "Chabahar"],
    primer: [
      "A trade corridor is a sea, rail or road route, together with the ports, agreements and investment built around it. The ones in the news include the India-Middle East-Europe Economic Corridor (IMEC), announced at the G20 summit in New Delhi in 2023; the International North-South Transport Corridor (INSTC), which links India to Russia through Iran; China's Belt and Road Initiative; and the Arctic Northern Sea Route.",
      "Corridors matter most for the choke points they avoid or depend on, such as Hormuz, the Red Sea and the Strait of Malacca.",
    ],
    whyIndia:
      "India is a partner in IMEC and INSTC and competes with Belt and Road projects around its neighbourhood. New routes change what Indian goods cost to move and which countries India depends on.",
    related: ["strait-of-hormuz", "red-sea", "india", "china"],
  },
];

// Actors: states' blocs, institutions and armed groups that recur in coverage.
export const ACTORS: LensEntity[] = [
  {
    slug: "nato",
    name: "NATO",
    kind: "actor",
    tagline: "The Western military alliance.",
    keywords: ["NATO"],
    primer: [
      "The North Atlantic Treaty Organization is a military alliance of North American and European countries founded in 1949. Its core promise, Article 5, treats an armed attack on one member as an attack on all.",
    ],
    related: ["russia", "ukraine", "united-states", "european-union"],
  },
  {
    slug: "opec",
    name: "OPEC and OPEC+",
    kind: "actor",
    tagline: "The oil exporters that try to steer the price.",
    keywords: ["OPEC", "OPEC+"],
    primer: [
      "OPEC is a group of major oil-exporting countries, led by Saudi Arabia, that coordinates how much oil its members produce. OPEC+ adds Russia and other producers, and its output decisions move oil prices.",
    ],
    whyIndia: "India buys most of its oil abroad, so OPEC+ production choices feed straight into Indian fuel and import costs.",
    related: ["saudi-arabia", "russia", "strait-of-hormuz"],
  },
  {
    slug: "brics",
    name: "BRICS",
    kind: "actor",
    tagline: "The bloc of large emerging economies.",
    keywords: ["BRICS"],
    primer: [
      "BRICS began as Brazil, Russia, India, China and South Africa and has since added more members. It is a forum for cooperation among large emerging economies, with debate over how far it should become a counterweight to Western-led institutions.",
    ],
    related: ["india", "china", "russia", "brazil"],
  },
  {
    slug: "european-union",
    name: "European Union",
    kind: "actor",
    tagline: "27 countries that act together on trade and sanctions.",
    keywords: ["European Union", "Brussels", "EU"],
    primer: [
      "The European Union is a political and economic union of 27 member states. It negotiates trade deals and imposes sanctions as a bloc, and the European Commission speaks for it on trade.",
    ],
    whyIndia: "The EU is one of India's largest trading partners, and an India-EU trade agreement has been under negotiation for years.",
    related: ["nato", "france", "germany", "russia"],
  },
  {
    slug: "quad",
    name: "The Quad",
    kind: "actor",
    tagline: "India, the US, Japan and Australia.",
    keywords: ["Quad", "Quadrilateral Security Dialogue"],
    primer: [
      "The Quadrilateral Security Dialogue brings together India, the United States, Japan and Australia. It is a consultative group on the Indo-Pacific rather than an alliance, and its leaders have met in person since 2021.",
    ],
    whyIndia: "It is India's main forum with the US, Japan and Australia on maritime security, technology and supply chains.",
    related: ["india", "china", "taiwan-strait"],
  },
  {
    slug: "g7",
    name: "G7",
    kind: "actor",
    tagline: "The seven large Western-aligned economies, plus the EU.",
    keywords: ["G7", "Group of Seven"],
    primer: [
      "The Group of Seven is made up of the United States, the United Kingdom, France, Germany, Italy, Japan and Canada, with the European Union attending. Its leaders and finance ministers coordinate on sanctions, energy and the global economy.",
    ],
    related: ["united-states", "european-union", "russia"],
  },
  {
    slug: "sco",
    name: "Shanghai Cooperation Organisation",
    kind: "actor",
    tagline: "The Eurasian security and economic grouping.",
    keywords: ["Shanghai Cooperation Organisation", "Shanghai Cooperation Organization", "SCO"],
    primer: [
      "The Shanghai Cooperation Organisation is a Eurasian political, economic and security grouping that includes China, Russia, India, Pakistan and Iran, among others. India joined in 2017.",
    ],
    related: ["china", "russia", "india", "pakistan"],
  },
  {
    slug: "irgc",
    name: "Iran's IRGC",
    kind: "actor",
    tagline: "Iran's parallel armed force and its reach abroad.",
    keywords: ["IRGC", "Revolutionary Guard", "Revolutionary Guards", "Quds Force"],
    primer: [
      "The Islamic Revolutionary Guard Corps was created after Iran's 1979 revolution and is separate from the regular army. It has its own ground, naval and air forces, runs the Quds Force that works with allied groups abroad, and controls large parts of Iran's economy.",
    ],
    related: ["iran", "strait-of-hormuz", "hezbollah", "houthis"],
  },
  {
    slug: "houthis",
    name: "The Houthis",
    kind: "actor",
    tagline: "The movement that holds northern Yemen and has attacked Red Sea shipping.",
    keywords: ["Houthi", "Houthis", "Ansar Allah"],
    primer: [
      "The Houthis, who call themselves Ansar Allah, are a Zaidi Shia movement that has controlled much of northern Yemen, including the capital Sanaa, since 2014. From late 2023 they attacked ships in the Red Sea, saying it was in response to the war in Gaza.",
    ],
    related: ["red-sea", "yemen", "irgc"],
  },
  {
    slug: "hezbollah",
    name: "Hezbollah",
    kind: "actor",
    tagline: "Lebanon's armed Shia movement and political party.",
    keywords: ["Hezbollah"],
    primer: [
      "Hezbollah is a Lebanese Shia political party and armed group, founded in the early 1980s with Iranian backing. It holds seats in Lebanon's parliament and has fought several wars with Israel.",
    ],
    related: ["lebanon", "israel", "iran", "irgc"],
  },
  {
    slug: "hamas",
    name: "Hamas",
    kind: "actor",
    tagline: "The Palestinian movement that has governed Gaza since 2007.",
    keywords: ["Hamas"],
    primer: [
      "Hamas is a Palestinian Islamist movement with political and armed wings that has governed the Gaza Strip since 2007. The United States, the European Union, the United Kingdom and several other governments designate it a terrorist organisation.",
    ],
    related: ["israel", "iran", "egypt"],
  },
];

// Themes: the ongoing storylines readers follow. A theme that lists a country
// by name (Iran, Ukraine, Israel) stands in for that country in the trending row. Edit this list as storylines
// start and end; each trends on its own when enough stories match.
export const THEMES: LensEntity[] = [
  {
    slug: "iran-war",
    name: "Iran war",
    kind: "theme",
    tagline: "The war with Iran and the talks around it.",
    keywords: ["Iran", "Iranian", "Tehran"],
  },
  {
    slug: "ukraine-war",
    name: "Ukraine war",
    kind: "theme",
    tagline: "The war in Ukraine and efforts to end it.",
    keywords: ["Ukraine", "Ukrainian", "Kyiv", "Zelenskyy", "Zelensky", "Kursk", "Donbas"],
  },
  {
    slug: "gaza-and-israel",
    name: "Gaza and Israel",
    kind: "theme",
    tagline: "The war in Gaza and the fighting around Israel.",
    keywords: ["Gaza", "West Bank", "Israel", "Israeli", "Netanyahu", "Rafah"],
  },
  {
    slug: "tariffs-and-trade",
    name: "Tariffs and trade",
    kind: "theme",
    tagline: "Tariffs, trade wars and export controls.",
    keywords: ["tariff", "tariffs", "trade war", "trade truce", "export controls"],
  },
  {
    slug: "india-us-trade",
    name: "India–US trade",
    kind: "theme",
    tagline: "The India–US trade deal and the tariff threats around it.",
    keywords: ["India-US", "US-India", "India-U.S.", "Goyal", "USTR"],
  },
  {
    slug: "us-midterms",
    name: "US midterms",
    kind: "theme",
    tagline: "The 2026 US midterm elections.",
    keywords: ["midterm", "midterms"],
  },
  {
    slug: "oil-and-energy",
    name: "Oil and energy",
    kind: "theme",
    tagline: "Oil, gas and fuel prices.",
    keywords: ["crude", "Brent", "diesel", "oil price", "oil prices", "energy prices", "LNG"],
  },
];

// Aliases for countries whose names show up in other forms in headlines.
const COUNTRY_ALIASES: Record<string, string[]> = {
  "United States": ["U.S.", "US"],
  "United Kingdom": ["UK", "Britain", "British"],
  "United Arab Emirates": ["UAE"],
  "South Korea": ["Seoul"],
  "North Korea": ["Pyongyang"],
  "Russia": ["Moscow", "Kremlin"],
  "China": ["Beijing"],
  "India": ["New Delhi"],
  "Iran": ["Tehran"],
  "Israel": ["Jerusalem"],
};

// One entry per country, skipping aliases of names already listed.
export const COUNTRIES: LensEntity[] = COUNTRY_NAMES.filter((n) => n !== "UAE").map((name) => ({
  slug: slugify(name),
  name,
  kind: "country" as const,
  tagline: "",
  keywords: [name, ...(COUNTRY_ALIASES[name] ?? [])],
}));

export const ALL_ENTITIES: LensEntity[] = [...THEMES, ...SYSTEMS, ...ACTORS, ...COUNTRIES];

const BY_SLUG = new Map(ALL_ENTITIES.map((e) => [e.slug, e]));

export function getLensEntity(slug: string): LensEntity | undefined {
  return BY_SLUG.get(slug);
}

const ESC = /[.*+?^${}()|[\]\\]/g;

// Whole-word match. Short keywords ("US", "EU", "UK") must match in the exact
// case given, so "us" the pronoun doesn't count; longer ones ignore case.
export function matchesKeyword(text: string, keyword: string): boolean {
  const body = keyword.replace(ESC, "\\$&");
  const re = new RegExp(`(^|[^A-Za-z0-9])${body}($|[^A-Za-z0-9])`, keyword.length <= 3 ? "" : "i");
  return re.test(text);
}

// Stories about an entity, newest first. A country also matches on the
// countries a story is about, which is the stronger signal.
export function storiesFor(entity: LensEntity, stories: Story[]): Story[] {
  return stories
    .filter((s) => {
      if (entity.kind === "country" && s.subjectCountries?.includes(entity.name)) return true;
      const text = `${s.headline} ${s.dek}`;
      return entity.keywords.some((k) => matchesKeyword(text, k));
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// How many sources each country contributed across a set of stories.
export function coverageCounts(stories: Story[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const s of stories) {
    for (const src of s.sources ?? []) {
      const c = src.sourceCountry;
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

// Countries grouped by region for the index page.
export function countriesByRegion(): { region: string; countries: LensEntity[] }[] {
  const order = [...REGIONS, "International"];
  const groups = new Map<string, LensEntity[]>(order.map((r) => [r, []]));
  for (const c of COUNTRIES) {
    const region = inferStoryRegion({ subjectCountries: [c.name] } as Story);
    groups.get(region)?.push(c);
  }
  return order
    .map((region) => ({ region, countries: (groups.get(region) ?? []).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((g) => g.countries.length > 0);
}

// A country page needs this many stories to be worth indexing or listing in
// the sitemap. Curated pages (systems, actors, themes) are always kept.
export const MIN_COUNTRY_STORIES = 3;

export function isThinCountry(entity: LensEntity, storyCount: number): boolean {
  return entity.kind === "country" && storyCount < MIN_COUNTRY_STORIES;
}
