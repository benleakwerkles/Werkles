import Link from "next/link";

const SURFACE_COPY = {
  workshop: {
    eyebrow: "Resources for the plan",
    title: "Find the tools, places, and local help this work may need.",
    body: "See how Werkles can turn a stated project and location into source-backed options you can compare—without pretending a listing is a recommendation."
  },
  bellows: {
    eyebrow: "Use the lesson in the world",
    title: "Move from a method to real places worth checking.",
    body: "The Bellows can teach you what to compare. This walkthrough shows how that method can lead to current suppliers, public help, meeting space, and money paths."
  },
  werkle: {
    eyebrow: "Resources for shared work",
    title: "Give the new Werkle something concrete to investigate together.",
    body: "A shared company room should surface real options, keep the source and unknowns visible, and let both people decide what deserves a call."
  }
} as const;

export function OpportunityWalkthroughDoor({ surface }: { surface: keyof typeof SURFACE_COPY }) {
  const copy = SURFACE_COPY[surface];
  return (
    <section className={`opportunity-door opportunity-door--${surface}`} aria-labelledby={`opportunity-door-${surface}`}>
      <div className="opportunity-door__object" aria-hidden="true">
        <span className="opportunity-door__handle" />
        <span className="opportunity-door__case"><i /><i /><i /></span>
      </div>
      <div>
        <p className="opportunity-door__eyebrow">{copy.eyebrow}</p>
        <h2 id={`opportunity-door-${surface}`}>{copy.title}</h2>
        <p>{copy.body}</p>
      </div>
      <Link className="button button-dark" href={`/draft-reviews/business-opportunities?surface=${surface}#resource-workflow`}>
        Open This Room&apos;s Resource Work
      </Link>
    </section>
  );
}
