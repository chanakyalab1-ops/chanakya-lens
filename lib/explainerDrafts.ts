// Evergreen backgrounders for storylines that have none. DRAFTS: nothing here is shown
// on the site until `published` is set to true, so they can be read, edited and
// approved first. Only structural, long-lasting facts are included; the war
// storylines are left for you to write in your own words.
export type ExplainerDraft = { slug: string; published: boolean; primer: string[]; whyItMatters: string };

export const EXPLAINER_DRAFTS: ExplainerDraft[] = [
  {
    slug: "tariffs-and-trade",
    published: false,
    primer: [
      "A tariff is a tax on imported goods. The importer pays it at the border, and it usually reaches buyers through higher prices or thinner profit margins. Governments use tariffs to protect local industry, to raise money or to pressure other governments.",
      "Tariffs are often answered with counter-tariffs, and they are usually announced, delayed and changed in stages. That is why a trade dispute can spread through supply chains, exchange rates and investment decisions long after the first headline.",
    ],
    whyItMatters: "Tariffs change what things cost and where companies decide to make them. Exporters, importers and anyone who buys imported goods can feel the effect, often months after the announcement.",
  },
  {
    slug: "india-us-trade",
    published: false,
    primer: [
      "The United States is one of India's largest export markets, and India buys energy, aircraft, technology and defence equipment from it. Trade between the two sits alongside wider ties on technology and security.",
      "Trade talks between the two cover tariffs, market access, digital rules and farm goods. Progress is usually announced in stages, so the details matter more than the headline.",
    ],
    whyItMatters: "Indian exporters, from textiles to IT services, depend on access to the American market. Changes in tariffs, visas or technology rules can affect jobs and prices at home.",
  },
  {
    slug: "oil-and-energy",
    published: false,
    primer: [
      "Oil and gas travel by sea and pipeline from a small number of large producers to many importers. Prices are set on global markets, so events far from home can change what fuel and power cost.",
      "Much of the world's oil trade passes through a few narrow routes, such as the Strait of Hormuz, and major producers coordinate output through groups like OPEC.",
    ],
    whyItMatters: "India imports most of the oil it uses, so higher crude prices tend to raise fuel and transport costs, widen the trade gap and put pressure on the rupee.",
  },
  {
    slug: "us-midterms",
    published: false,
    primer: [
      "Midterm elections are held halfway through a US president's four-year term. All 435 seats in the House of Representatives and about a third of the Senate are up for election.",
      "They decide which party controls Congress, which in turn shapes what a president can pass, investigate and fund.",
    ],
    whyItMatters: "Congress controls trade law, sanctions and defence spending, so the result changes how Washington treats allies, rivals and trade partners.",
  },
];
