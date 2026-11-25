// Plain-language definitions of terms our stories use. Each term can point at the
// Lens pages where it comes up (slugs from lib/lens.ts).
export type GlossaryTerm = { term: string; slug: string; definition: string; lens?: string[]; see?: { label: string; href: string } };

export const GLOSSARY: GlossaryTerm[] = [
  { term: "Blockade", slug: "blockade", definition: "Using military force to stop ships or goods from entering or leaving a port or coast. A formal blockade is usually treated as an act of war." },
  { term: "Brent", slug: "brent", definition: "A benchmark price for crude oil, used to price a large part of the world's oil trade.", lens: ["oil-and-energy", "strait-of-hormuz"] },
  { term: "BRICS", slug: "brics", definition: "A group of large emerging economies, originally Brazil, Russia, India, China and South Africa, which has since added more members.", lens: ["brics"] },
  { term: "Buffer state", slug: "buffer-state", definition: "A country that sits between two rival powers and so lowers the chance of the two clashing directly." },
  { term: "Ceasefire", slug: "ceasefire", definition: "An agreement to stop fighting. It can be temporary and does not by itself end a war.", lens: ["gaza-and-israel", "ukraine-war", "iran-war"] },
  { term: "Chokepoint", slug: "chokepoint", definition: "A narrow passage, such as a strait or a canal, that a lot of trade has to pass through. When it is disrupted, the effect spreads widely.", lens: ["strait-of-hormuz", "red-sea", "taiwan-strait", "trade-corridors"] },
  { term: "Current account deficit", slug: "current-account-deficit", definition: "When a country pays out more to the rest of the world for goods, services and income than it earns from it. It has to be covered by borrowing or investment from abroad.", lens: ["oil-and-energy"] },
  { term: "De-dollarisation", slug: "de-dollarisation", definition: "Efforts by countries to rely less on the US dollar in trade, savings and payments.", lens: ["brics"] },
  { term: "Dual-use", slug: "dual-use", definition: "Goods or technology that have both civilian and military uses, such as some chips, drones and chemicals.", lens: ["semiconductors"] },
  { term: "Embargo", slug: "embargo", definition: "A ban on trade with a particular country, or on particular goods such as arms or oil." },
  { term: "Export controls", slug: "export-controls", definition: "Rules that limit which goods, technology or software can be sold to other countries, usually for security reasons.", lens: ["semiconductors", "tariffs-and-trade"] },
  { term: "Grey zone", slug: "grey-zone", definition: "Hostile actions that stay below the level of open war, such as cyberattacks, sabotage or coast guard harassment." },
  { term: "Impact rating", slug: "impact-rating", definition: "How we mark each effect on a reader: Direct, Likely or Possible, depending on how many steps in the chain are still unconfirmed.", see: { label: "How we rate this", href: "/how-we-rate" } },
  { term: "LNG", slug: "lng", definition: "Liquefied natural gas: natural gas cooled to a liquid so it can be shipped by sea in special tankers.", lens: ["strait-of-hormuz", "oil-and-energy"] },
  { term: "NATO", slug: "nato", definition: "A military alliance of North American and European countries whose members agree to defend one another if one is attacked.", lens: ["nato"] },
  { term: "Non-alignment", slug: "non-alignment", definition: "A policy of not formally joining a major power bloc. India's foreign policy has long emphasised it." },
  { term: "OPEC", slug: "opec", definition: "The Organization of the Petroleum Exporting Countries, a group of oil producers that coordinates how much oil its members produce. OPEC+ adds other producers, including Russia.", lens: ["opec", "oil-and-energy"] },
  { term: "Proxy war", slug: "proxy-war", definition: "A conflict in which outside powers back opposing local sides instead of fighting each other directly.", lens: ["iran-war", "gaza-and-israel"] },
  { term: "Quad", slug: "quad", definition: "A grouping of Australia, India, Japan and the United States that works together on security and other issues in the Indo-Pacific.", lens: ["quad"] },
  { term: "Rare earths", slug: "rare-earths", definition: "A group of 17 metals used in magnets, electronics and defence equipment, much of it processed in China.", lens: ["trade-corridors", "semiconductors"] },
  { term: "Sanctions", slug: "sanctions", definition: "Penalties one country or group puts on another, such as banning trade or freezing assets, to pressure a change in behaviour.", lens: ["iran-war", "ukraine-war"] },
  { term: "Secondary sanctions", slug: "secondary-sanctions", definition: "Penalties aimed at companies or banks in third countries that deal with a sanctioned country, to stop them helping it get around sanctions." },
  { term: "Semiconductor", slug: "semiconductor", definition: "A chip made from a material such as silicon that carries out the calculations in nearly every electronic device.", lens: ["semiconductors", "taiwan-strait"] },
  { term: "Shadow fleet", slug: "shadow-fleet", definition: "Ageing ships, often with unclear ownership and insurance, used to carry sanctioned oil.", lens: ["oil-and-energy"] },
  { term: "Single point of failure", slug: "single-point-of-failure", definition: "A step or place in a supply chain with no easy substitute, so one break stops everything.", lens: ["semiconductors", "trade-corridors"] },
  { term: "Sovereign wealth fund", slug: "sovereign-wealth-fund", definition: "A state-owned investment fund, usually built from surplus income such as oil revenue." },
  { term: "Strait", slug: "strait", definition: "A narrow sea channel that connects two larger bodies of water.", lens: ["strait-of-hormuz", "taiwan-strait"] },
  { term: "Strategic autonomy", slug: "strategic-autonomy", definition: "A country's aim to keep the freedom to make its own foreign-policy and defence choices without depending on any one power." },
  { term: "Supply chain", slug: "supply-chain", definition: "The chain of steps and places through which a product is made and delivered, from raw material to buyer.", lens: ["trade-corridors", "semiconductors"] },
  { term: "SWIFT", slug: "swift", definition: "A messaging network that banks use to send payment instructions across borders. Being cut off from it makes international payments much harder." },
  { term: "Tariff", slug: "tariff", definition: "A tax a government puts on imported goods. The importer pays it at the border and it often reaches buyers through higher prices.", lens: ["tariffs-and-trade", "india-us-trade"] },
  { term: "War-risk premium", slug: "war-risk-premium", definition: "The extra insurance charge ships pay to sail through dangerous waters. It raises the cost of shipping and, in the end, of goods.", lens: ["red-sea", "strait-of-hormuz"] },
];

export const glossaryFor = (lensSlug: string): GlossaryTerm[] => GLOSSARY.filter((t) => t.lens?.includes(lensSlug));
