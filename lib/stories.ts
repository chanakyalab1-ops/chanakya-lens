export type ConfidenceLevel = "direct" | "likely" | "possible";

export type ImpactNode = {
  confidence: ConfidenceLevel;
  audience: string;
  mechanism: string;
};

export type Story = {
  slug: string;
  category: string;
  status?: "developing" | "settled";
  headline: string;
  dek: string;
  readTime: string;
  hasVideo?: boolean;
  impactNodes?: ImpactNode[]; // omit entirely = plain brief
};

export const stories: Story[] = [
  {
    slug: "yemen-houthi-escalation",
    category: "Security & Conflict",
    status: "developing",
    headline: "Yemen's Houthi-government fighting escalates to its deadliest point in years",
    dek: "A naval blockade and deadliest-in-years strikes push Yemen toward its highest conflict risk since the 2022 truce.",
    readTime: "7 min",
    impactNodes: [
      { confidence: "direct", audience: "If you buy anything shipped through the Red Sea/Suez route", mechanism: "The Houthi-declared naval blockade adds a new disruption on top of ongoing shipping attacks, pushing up freight and insurance costs." },
      { confidence: "possible", audience: "If you follow Saudi-Iran regional tensions", mechanism: "This escalation is entangled with the broader Saudi-Iran rivalry that has shaped the wider war for a decade." },
      { confidence: "possible", audience: "If you follow refugee/aid flows in the region", mechanism: "Renewed large-scale conflict risk typically disrupts aid funding and access first." },
      { confidence: "possible", audience: "If you're watching the Iran-aligned regional network", mechanism: "The Houthis are separately engaged in strikes tied to Iran and Hezbollah — one node in a broader alignment." },
    ],
  },
  {
    slug: "ustr-india-tariff-tier",
    category: "Trade & Tariffs",
    status: "settled",
    headline: "USTR places India in the lower tariff tier under new forced-labor rules",
    dek: "Most coverage missed who actually pays a tariff — it isn't the exporting country.",
    readTime: "6 min",
    hasVideo: true,
    impactNodes: [
      { confidence: "direct", audience: "If you're an Indian exporter", mechanism: "The new 10% duty stacks on whatever base tariff already applies — and if your sector isn't exempted, U.S. buyers have a fresh incentive to shop elsewhere." },
      { confidence: "direct", audience: "If you're an American consumer", mechanism: "Tariffs are paid by the importer, not the exporting country — so U.S. businesses absorb the cost first and often pass some through in retail prices." },
      { confidence: "likely", audience: "If you export textiles from Bangladesh, Cambodia, Indonesia, or Malaysia", mechanism: "A new textile-specific quota mechanism shifts your relative price advantage against India." },
      { confidence: "possible", audience: "If you follow US–India relations", mechanism: "This is one piece of a larger, unresolved negotiation toward a full trade deal." },
    ],
  },
  {
    slug: "asml-export-pressure",
    category: "Tech & Regulation",
    headline: "The world's only advanced chipmaking tool company is caught between Washington and Beijing",
    dek: "One Dutch company's export licenses shape what chips end up in your next phone.",
    readTime: "5 min",
    impactNodes: [
      { confidence: "direct", audience: "If you buy phones, laptops, or anything with an advanced chip", mechanism: "ASML makes the machines nearly every advanced chipmaker depends on — disruption ripples into chip production broadly." },
      { confidence: "direct", audience: "If you invest in tech or semiconductor stocks", mechanism: "ASML stock has dropped 5-6% in single sessions purely on export-restriction news." },
      { confidence: "possible", audience: "If you follow the US-China tech rivalry", mechanism: "Dutch cooperation is essential for US restrictions to actually work — a rare single-company chokepoint." },
      { confidence: "possible", audience: "If you work in or near chip manufacturing", mechanism: "China is attempting to build competing lithography tools domestically in response." },
    ],
  },
  {
    slug: "india-fcra-amendment",
    category: "Political",
    headline: "India tightens control over NGO foreign funding under new FCRA rules",
    dek: "A new government authority can now seize NGO assets without prior judicial review.",
    readTime: "3 min",
  },
  {
    slug: "drought-mining-crisis",
    category: "Resources",
    headline: "This summer's droughts are also a mining crisis — and the two are the same story",
    dek: "Over half the world's lithium and cobalt comes from regions already running out of water.",
    readTime: "4 min",
  },
];
