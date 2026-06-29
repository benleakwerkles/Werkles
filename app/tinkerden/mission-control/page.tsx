import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TinkerDen Mission Control | Werkles",
  description: "Mission Control is WHY: destination, frontier, success conditions, and non-goals.",
  robots: { index: false, follow: false }
};

type MissionCard = {
  title: string;
  destination: string;
  sourceMaterial: string;
  currentFrontier: string;
  successConditions: string[];
  nonGoals: string[];
};

const missions: MissionCard[] = [
  {
    title: "Werkles",
    destination:
      "Make Werkles understandable to a stranger as a human trust and opportunity engine for real builders.",
    sourceMaterial:
      "Homepage truth pass, archetype card system, Foundry Dues language, and the current Werkles public surface.",
    currentFrontier:
      "Turn the public story from fantasy-first into people, trust, momentum, and opportunity.",
    successConditions: [
      "A stranger can say who Werkles is for within 10 seconds.",
      "The first screen names what Werkles does without abstract promise.",
      "Trust is visible as proof before reliance, not a fuzzy badge."
    ],
    nonGoals: [
      "No portal energy.",
      "No dashboard plumbing.",
      "No doctrine or dispatch mechanics."
    ]
  },
  {
    title: "Oddly Godly",
    destination:
      "Protect and shape the weird true signal so it can become usable source material instead of drifting as a loose artifact.",
    sourceMaterial:
      "Oddly Godly handoff material, source docs, and any returned review receipts from Dink or Spanzee.",
    currentFrontier:
      "Name the next proof artifact and decide what must survive into the next visible version.",
    successConditions: [
      "The core idea is readable without private context.",
      "The next artifact has one owner and one return path.",
      "Open questions are separated from claims."
    ],
    nonGoals: [
      "No rewriting the whole work.",
      "No aesthetic detour.",
      "No unsourced claims promoted as proof."
    ]
  },
  {
    title: "Tinkularity",
    destination:
      "Make TinkerDen the place where missions keep direction while Bridge handles the live operational now.",
    sourceMaterial:
      "TinkerDen spinal cord, filesystem blood and synapses, receipt provenance, and Speaker inheritance feed.",
    currentFrontier:
      "Separate WHY from NOW so Ben can see where the work is going before touching queues or receipts.",
    successConditions: [
      "Mission Control answers where we are going within 10 seconds.",
      "Bridge remains the operational surface for queues, receipts, and dispatch.",
      "Each mission card names success and non-goals plainly."
    ],
    nonGoals: [
      "No queue.",
      "No receipts.",
      "No doctrine.",
      "No dispatch panel.",
      "No technical implementation detail."
    ]
  }
];

export default function TinkerDenMissionControlPage() {
  return (
    <main className="td-mission-control">
      <nav className="td-surface-switcher" aria-label="TinkerDen surface switcher">
        <Link className="td-surface-switcher__link td-surface-switcher__link--active" href="/tinkerden/mission-control">
          Mission Control
        </Link>
        <Link className="td-surface-switcher__link" href="/tinkerden">
          Bridge
        </Link>
        <Link className="td-surface-switcher__link" href="/tinkerden/human-gates">
          Human Gates
        </Link>
      </nav>

      <header className="td-mission-control__hero">
        <p className="td-mission-control__eyebrow">Mission Control is WHY</p>
        <h1>Where are we going?</h1>
        <p>
          Mission Control holds direction: destination, source material, current frontier, success conditions, and non-goals.
          Bridge holds the operational now.
        </p>
      </header>

      <section className="td-mission-control__grid" aria-label="Mission Control cards">
        {missions.map((mission) => (
          <article className="td-mission-card" key={mission.title}>
            <header>
              <p>MISSION</p>
              <h2>{mission.title}</h2>
            </header>

            <dl className="td-mission-card__facts">
              <div>
                <dt>Destination</dt>
                <dd>{mission.destination}</dd>
              </div>
              <div>
                <dt>Source Material</dt>
                <dd>{mission.sourceMaterial}</dd>
              </div>
              <div>
                <dt>Current Frontier</dt>
                <dd>{mission.currentFrontier}</dd>
              </div>
            </dl>

            <section>
              <h3>Success Conditions</h3>
              <ul>
                {mission.successConditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Non-Goals</h3>
              <ul>
                {mission.nonGoals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </article>
        ))}
      </section>
    </main>
  );
}
