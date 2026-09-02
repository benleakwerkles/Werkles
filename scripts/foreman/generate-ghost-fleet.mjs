#!/usr/bin/env node
/**
 * Generate synthetic Ghost Fleet members (text only — no face spend).
 * Deterministic: same count always produces the same fleet.
 * Usage: node scripts/foreman/generate-ghost-fleet.mjs [count=150]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const count = Math.max(1, Math.min(500, Number(process.argv[2] || 150)));
const root = process.cwd();

/* Deterministic PRNG so the fleet is reproducible across machines. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const firstNames = [
  "Ava", "Marcus", "Priya", "Deshawn", "Elena", "Tomas", "Nia", "Hollis",
  "Yusuf", "Cara", "Bao", "Renata", "Silas", "Imani", "Grant", "Lucia",
  "Omar", "Frankie", "Talia", "Dov", "Kenji", "Rosa", "Wendell", "Mira",
  "Curtis", "Aisha", "Bo", "Simone", "Vic", "Halle", "Jonas", "Delia",
  "Ray", "Noor", "Gus", "Camille", "Trey", "Ingrid", "Malik", "Junie"
];
const lastNames = [
  "Rivera", "Okafor", "Nguyen", "Brooks", "Patel", "Hayes", "Ortiz", "Kim",
  "Sullivan", "Clarke", "Diaz", "Bennett", "Shah", "Coleman", "Reed",
  "Foster", "Alvarez", "Whitfield", "Marchetti", "Osei", "Lindqvist",
  "Barros", "Tran", "McBride", "Salazar", "Duval", "Pham", "Ruiz"
];
const places = [
  ["Norfolk", "VA"], ["Richmond", "VA"], ["Columbus", "OH"],
  ["Pittsburgh", "PA"], ["Detroit", "MI"], ["Atlanta", "GA"],
  ["Nashville", "TN"], ["Charlotte", "NC"], ["Baltimore", "MD"],
  ["Cleveland", "OH"], ["Louisville", "KY"], ["Kansas City", "MO"],
  ["Milwaukee", "WI"], ["Buffalo", "NY"], ["Birmingham", "AL"],
  ["Tucson", "AZ"], ["Spokane", "WA"], ["Des Moines", "IA"],
  ["Providence", "RI"], ["El Paso", "TX"]
];
const seats = [
  "LadyJessica", "Ender", "Bean", "Heimerdinker",
  "Petra", "Skybro", "Computer", "ImageSniper"
];

/**
 * Each archetype is a distinct working situation, not a reskinned template.
 * Slots marked {city}/{n}/{months} are filled per member so no two intakes
 * read identically to the matching engine.
 */
const archetypes = [
  {
    lane: "Operator",
    role: "Kitchen operator",
    skills: ["Line management", "Food cost", "Scheduling"],
    offers: ["Kitchen ops coverage", "Opening checklists", "Vendor negotiation"],
    seeks: ["Lease guarantor", "Weekend coverage"],
    capital: "not_qualified",
    partner: true,
    need: "I need a co-signer for a commercial kitchen lease in {city} so I can stop cooking someone else's menu.",
    tried: "Two landlords walked me through the space and both asked for a guarantor I do not have.",
    time: "Rewriting the lease packet after close, usually {n} nights a week.",
    stuck: "Hold out for a guarantor or take the shared kitchen at half the hours.",
    success: "Lease signed, first catering route booked, and I am off the corporate schedule.",
    gaps: ["Funds not verified", "Business entity not confirmed"]
  },
  {
    lane: "Backer",
    role: "Retired contractor",
    skills: ["Credit review", "Bonding", "Site inspection"],
    offers: ["Co-signer capacity", "Lease guarantor", "Capital introductions", "Bonding guidance"],
    seeks: ["Operators worth backing", "Deal flow"],
    capital: "can_back",
    partner: true,
    need: "I have capital sitting idle and no operator I trust in {city} to put it behind.",
    tried: "Backed one build-out that stalled because nobody owned the schedule.",
    time: "Reading pitches that never show a real cost sheet — about {n} a month.",
    stuck: "Write smaller checks to more people or one real check to one operator.",
    success: "Two funded operators still trading in {months} months, with proof I can point to.",
    gaps: ["Identity not verified"]
  },
  {
    lane: "Builder",
    role: "Cabinet maker",
    skills: ["Millwork", "CAD", "Install crews"],
    offers: ["Build capacity", "Shop space", "Install crew"],
    seeks: ["Steady contract work", "Bookkeeping help", "Quoting help"],
    capital: "not_qualified",
    partner: true,
    need: "I can build faster than I can quote, so work in {city} sits while I do paperwork.",
    tried: "Hired a part-time bookkeeper who quit after {n} weeks.",
    time: "Quoting jobs and chasing invoices instead of being in the shop.",
    stuck: "Bring in a partner who handles the office or stay a one-man shop.",
    success: "Quotes out same day, shop booked {months} months ahead, no unpaid invoices.",
    gaps: ["License copy missing", "Funds not verified"]
  },
  {
    lane: "Connector",
    role: "Neighborhood organizer",
    skills: ["Vendor sourcing", "Permits", "Community outreach"],
    offers: ["Vendor network", "Permit navigation", "Landlord introductions"],
    seeks: ["Paid role", "Steady contract"],
    capital: "not_qualified",
    partner: false,
    need: "I know every vendor and landlord in {city} but none of it pays my rent.",
    tried: "Consulted informally for {n} businesses and got paid by two.",
    time: "Unpaid favors — introductions, permit questions, translation.",
    stuck: "Charge for what I already do or take a salaried job and stop.",
    success: "A paid seat where the connecting work is the job, not the hobby.",
    gaps: ["Funds not verified"]
  },
  {
    lane: "Worker",
    role: "HVAC tech",
    skills: ["Diagnostics", "Refrigerant handling", "Service calls"],
    offers: ["Licensed trade hours", "Service coverage", "Apprentice training"],
    seeks: ["Ownership path", "Truck financing"],
    capital: "not_qualified",
    partner: true,
    need: "I run {n} service calls a day for a company I will never own a piece of.",
    tried: "Asked about a partnership track and got a raise instead.",
    time: "Windshield time and callbacks on jobs somebody else priced wrong.",
    stuck: "Buy a truck and go out alone or find a partner already licensed.",
    success: "My own plate, two trucks, and a schedule I set.",
    gaps: ["Funds not verified", "Insurance not confirmed"]
  },
  {
    lane: "Operator",
    role: "Salon owner",
    skills: ["Booth rental", "Retail mix", "Client retention"],
    offers: ["Chair space", "Front-desk systems", "Retail buying"],
    seeks: ["Second-location capital", "Manager who stays"],
    capital: "not_qualified",
    partner: true,
    need: "The first salon in {city} works and the second one keeps failing on paper.",
    tried: "Ran the numbers with my accountant {n} times and got a different answer each time.",
    time: "Covering the front desk because the manager left again.",
    stuck: "Borrow for the second location or buy out my slowest competitor.",
    success: "Two rooms profitable in {months} months and I am not on the floor daily.",
    gaps: ["Funds not verified", "Lease terms unreviewed"]
  },
  {
    lane: "Builder",
    role: "Software freelancer",
    skills: ["Backend", "Integrations", "Data cleanup"],
    offers: ["Build capacity", "Systems automation", "Technical diligence"],
    seeks: ["Non-technical partner", "Sales coverage"],
    capital: "not_qualified",
    partner: true,
    need: "I can build the product but I cannot sell it, so it sits at {n} users.",
    tried: "Cold outreach for {months} months with almost nothing back.",
    time: "Rebuilding features nobody asked for because I am guessing.",
    stuck: "Find a selling partner or go back to contract work.",
    success: "Paying customers I did not personally beg for.",
    gaps: ["Identity not verified"]
  },
  {
    lane: "Connector",
    role: "Logistics broker",
    skills: ["Freight lanes", "Carrier vetting", "Contract terms"],
    offers: ["Carrier network", "Route planning", "Contract review"],
    seeks: ["Warehouse space", "Working capital"],
    capital: "not_qualified",
    partner: false,
    need: "I move freight through {city} with no warehouse of my own to stage it.",
    tried: "Subleased dock space for {n} months and lost the margin to fees.",
    time: "Re-routing loads by phone when a carrier drops.",
    stuck: "Lease a small warehouse or stay asset-light and thin.",
    success: "Own dock, steady lanes, margin that survives a dropped carrier.",
    gaps: ["Funds not verified", "Insurance not confirmed"]
  },
  {
    lane: "Backer",
    role: "Credit union officer",
    skills: ["Underwriting", "Member lending", "Cash-flow review"],
    offers: ["Lending guidance", "Underwriting review", "Capital introductions", "Proof coaching"],
    seeks: ["Borrowers with real books", "Local deal flow"],
    capital: "can_back",
    partner: false,
    need: "I can lend in {city} but almost nobody arrives with books I can actually read.",
    tried: "Ran {n} free workshops on preparing a loan packet.",
    time: "Declining applications that were only paperwork away from yes.",
    stuck: "Keep coaching applicants myself or partner with someone who preps them.",
    success: "A pipeline of borrowers who show up ready in {months} months.",
    gaps: ["Identity not verified"]
  },
  {
    lane: "Worker",
    role: "Pastry cook",
    skills: ["Production baking", "Costing", "Wholesale accounts"],
    offers: ["Production capacity", "Recipe costing", "Early-shift coverage"],
    seeks: ["Commercial oven access", "Wholesale introductions"],
    capital: "not_qualified",
    partner: true,
    need: "My wholesale orders in {city} outgrew a home oven {months} months ago.",
    tried: "Rented kitchen time overnight and lost {n} accounts to late deliveries.",
    time: "Driving between rented kitchens instead of baking.",
    stuck: "Finance an oven or partner with a kitchen that has idle hours.",
    success: "One kitchen, morning deliveries, accounts that stopped leaving.",
    gaps: ["Funds not verified", "Food safety cert unconfirmed"]
  },
  {
    lane: "Operator",
    role: "Auto shop manager",
    skills: ["Service writing", "Parts sourcing", "Tech retention"],
    offers: ["Shop management", "Parts network", "Tech hiring"],
    seeks: ["Ownership stake", "Buyout financing"],
    capital: "not_qualified",
    partner: true,
    need: "The owner in {city} wants out and I am the only one who can run it.",
    tried: "Two banks looked at the buyout and both wanted collateral I do not have.",
    time: "Running the floor and the books because there is nobody else.",
    stuck: "Find a backer for the buyout or watch it sell to a chain.",
    success: "My name on the shop and the same crew still there in {months} months.",
    gaps: ["Funds not verified", "Business entity not confirmed"]
  },
  {
    lane: "Unsure",
    role: "Career changer",
    skills: ["Project coordination", "Vendor management", "Budgets"],
    offers: ["Coordination", "Budget tracking", "Admin coverage"],
    seeks: ["Direction", "Training", "A first real project"],
    capital: "not_qualified",
    partner: true,
    need: "I have {n} years of coordination work and no idea what I am building toward.",
    tried: "Took two certificate courses that led nowhere specific.",
    time: "Applying to roles that all describe the job I already left.",
    stuck: "Pick a lane and commit or keep taking whatever pays.",
    success: "Something with my name on it instead of another coordinator title.",
    gaps: ["Identity not verified", "License copy missing"]
  }
];

function member(index, rand) {
  const n = index + 1;
  const id = `ghost_${String(n).padStart(3, "0")}`;
  const arch = archetypes[index % archetypes.length];
  const [city, region] = places[Math.floor(rand() * places.length)];
  const displayName = `${firstNames[Math.floor(rand() * firstNames.length)]} ${
    lastNames[Math.floor(rand() * lastNames.length)]
  }`;
  const smallN = 2 + Math.floor(rand() * 7);
  const months = [6, 9, 12, 18, 24][Math.floor(rand() * 5)];

  const fill = (text) =>
    text.replace(/\{city\}/g, city).replace(/\{n\}/g, String(smallN)).replace(/\{months\}/g, String(months));

  /* Eligibility spread keeps blocked/review paths exercised by the Handeyes. */
  const roll = rand();
  const introEligibility = roll < 0.12 ? "blocked" : roll < 0.32 ? "review_required" : "open";

  return {
    id,
    synthetic: true,
    displayName,
    city,
    region,
    lane: arch.lane,
    roleLabel: arch.role,
    skills: arch.skills,
    offers: arch.offers,
    seeks: arch.seeks,
    capitalPosture: arch.capital,
    openToPartner: arch.partner,
    statedNeed: fill(arch.need),
    alreadyTried: fill(arch.tried),
    timeCost: fill(arch.time),
    stuckDecision: fill(arch.stuck),
    successTwelveMonths: fill(arch.success),
    proofGaps: arch.gaps,
    workshopHeadline: `${displayName.split(" ")[0]} — ${arch.role.toLowerCase()} in ${city}`,
    workshopRows: [
      fill(arch.stuck),
      `${arch.offers.length} things they can carry`,
      `${arch.gaps.length} proof gaps open`
    ],
    introEligibility,
    handeyeSeat: seats[index % seats.length],
    faceAsset: `/assets/draft/ghost-fleet/${id}-portrait.jpg`,
    faceStatus: "placeholder"
  };
}

const rand = mulberry32(20260803);
const fleet = {
  version: "v2",
  synthetic: true,
  label: "CBCC Ghost Fleet",
  disclosure:
    "Synthetic test members (Ghost Fleet). Not real people. Local/Preview Handeye use only until Operator promote phrase.",
  generatedAt: new Date().toISOString(),
  targetCount: count,
  members: Array.from({ length: count }, (_, i) => member(i, rand))
};

const outDir = path.join(root, "data", "ghost-fleet");
await mkdir(outDir, { recursive: true });
await mkdir(path.join(root, "public", "assets", "draft", "ghost-fleet"), { recursive: true });
await writeFile(path.join(outDir, "members.json"), `${JSON.stringify(fleet, null, 2)}\n`, "utf8");

const lanes = {};
const postures = {};
for (const m of fleet.members) {
  lanes[m.lane] = (lanes[m.lane] || 0) + 1;
  postures[m.capitalPosture] = (postures[m.capitalPosture] || 0) + 1;
}
const uniqueNeeds = new Set(fleet.members.map((m) => m.statedNeed)).size;
console.log(
  JSON.stringify({ count, uniqueNeeds, lanes, postures, out: "data/ghost-fleet/members.json" }, null, 2)
);
