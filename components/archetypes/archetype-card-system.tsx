import type { CSSProperties } from "react";

export type ArchetypeCard = {
  title: "Spark" | "Builder" | "Operator" | "Worker" | "Connector" | "Backer";
  description: string;
  accent: string;
  strengths: string[];
  commonFrustrations: string[];
  whatTheyNeed: string[];
  whatTheyOffer: string[];
  exampleProfiles: string[];
};

export const ARCHETYPE_CARDS: ArchetypeCard[] = [
  {
    title: "Spark",
    description: "Sees the possibility first and gives the work its original charge.",
    accent: "#ff8a3d",
    strengths: ["Original ideas", "Pattern spotting", "Momentum", "Narrative energy"],
    commonFrustrations: ["Ideas stall before they become concrete", "People ask for plans too early", "Too many threads compete for attention"],
    whatTheyNeed: ["A builder to shape the first artifact", "An operator to choose the next constraint", "A worker who can test quickly"],
    whatTheyOffer: ["New angles", "Useful tension", "A reason to begin", "Language that makes the work contagious"],
    exampleProfiles: ["Founder with a raw concept", "Product visionary", "Creative strategist"]
  },
  {
    title: "Builder",
    description: "Turns a promising idea into a visible artifact people can react to.",
    accent: "#18b6ff",
    strengths: ["Prototyping", "Systems thinking", "Technical judgment", "Making the work tangible"],
    commonFrustrations: ["Vague briefs", "Shifting requirements", "No clear owner for decisions"],
    whatTheyNeed: ["A crisp problem statement", "Fast feedback", "A decision owner who can cut scope"],
    whatTheyOffer: ["Working demos", "Technical paths", "Reusable parts", "Proof that an idea can exist"],
    exampleProfiles: ["Software maker", "Product engineer", "No-code prototype builder"]
  },
  {
    title: "Operator",
    description: "Makes the work legible, sequenced, staffed, and accountable.",
    accent: "#7c5cff",
    strengths: ["Prioritization", "Process design", "Risk control", "Follow-through"],
    commonFrustrations: ["Unowned decisions", "Loose handoffs", "Too many priorities treated as equal"],
    whatTheyNeed: ["Clear authority", "Truthful status", "Receipts for progress and blockers"],
    whatTheyOffer: ["Execution rhythm", "Decision hygiene", "Resource focus", "A path through complexity"],
    exampleProfiles: ["COO type", "Project lead", "Chief of staff"]
  },
  {
    title: "Worker",
    description: "Carries the practical load and converts plans into completed steps.",
    accent: "#2fbf71",
    strengths: ["Consistency", "Craft", "Task completion", "Reality checks"],
    commonFrustrations: ["Invisible labor", "Missing context", "Being handed theater instead of usable instructions"],
    whatTheyNeed: ["Specific tasks", "Enough context to avoid rework", "Respect for the work surface"],
    whatTheyOffer: ["Reliable output", "Ground truth", "Applied skill", "Operational stamina"],
    exampleProfiles: ["Specialist contractor", "Production teammate", "Hands-on implementer"]
  },
  {
    title: "Connector",
    description: "Finds the right people, context, and trust paths for the work to move.",
    accent: "#f4c542",
    strengths: ["Network sense", "Translation", "Introductions", "Trust building"],
    commonFrustrations: ["Weak asks", "No clear reason for an intro", "People treating relationships like a database"],
    whatTheyNeed: ["A precise ask", "A credible story", "Respect for social context"],
    whatTheyOffer: ["Warm paths", "Context bridging", "Credibility transfer", "Better rooms"],
    exampleProfiles: ["Community builder", "Partnership lead", "Market mapper"]
  },
  {
    title: "Backer",
    description: "Supplies capital, belief, leverage, or cover so the work can survive long enough to prove itself.",
    accent: "#d965a8",
    strengths: ["Resourcing", "Judgment", "Longer time horizons", "Strategic cover"],
    commonFrustrations: ["Unclear upside", "Unpriced risk", "Founders who cannot say what help means"],
    whatTheyNeed: ["A believable plan", "Visible risk", "Proof of motion", "A clear role"],
    whatTheyOffer: ["Money", "Access", "Patience", "Strategic pressure"],
    exampleProfiles: ["Angel investor", "Sponsor", "Strategic advisor"]
  }
];

function ArchetypeList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="archetype-card__fact">
      <dt>{label}</dt>
      <dd>
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </dd>
    </div>
  );
}

export function ArchetypeCardSystem({ cards = ARCHETYPE_CARDS }: { cards?: ArchetypeCard[] }) {
  return (
    <section className="archetype-system" aria-labelledby="archetype-system-title">
      <div className="archetype-system__head">
        <p className="archetype-system__eyebrow">Canonical six archetypes</p>
        <h1 id="archetype-system-title">Archetype Card System</h1>
        <p>
          Six reusable cards for naming how people naturally create value in Werkles: the spark,
          the maker, the organizer, the doer, the bridge, and the believer.
        </p>
      </div>

      <div className="archetype-system__grid">
        {cards.map((card) => (
          <details
            key={card.title}
            className="archetype-card"
            style={{ "--archetype-accent": card.accent } as CSSProperties}
          >
            <summary className="archetype-card__summary">
              <span className="archetype-card__accent" aria-hidden="true" />
              <span className="archetype-card__summary-copy">
                <span className="archetype-card__title">{card.title}</span>
                <span className="archetype-card__description">{card.description}</span>
              </span>
              <span className="archetype-card__toggle" aria-hidden="true">Open</span>
            </summary>
            <dl className="archetype-card__body">
              <ArchetypeList label="Strengths" items={card.strengths} />
              <ArchetypeList label="Common frustrations" items={card.commonFrustrations} />
              <ArchetypeList label="What they need" items={card.whatTheyNeed} />
              <ArchetypeList label="What they offer" items={card.whatTheyOffer} />
              <ArchetypeList label="Example profiles" items={card.exampleProfiles} />
            </dl>
          </details>
        ))}
      </div>
    </section>
  );
}
