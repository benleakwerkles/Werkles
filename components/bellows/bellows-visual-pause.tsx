import Image from "next/image";

export type BellowsVisualPauseVariant = "people" | "workspace" | "tools";

const SCENES = Object.freeze({
  people: {
    src: "/assets/draft/people-v1/people-partners-cafe.png",
    alt: "Two people comparing plans together at a café table",
    label: "A conversation becomes useful when both people can see the same problem.",
    note: "The work is still human—even when the lesson lives on a screen."
  },
  workspace: {
    src: "/assets/draft/industry-breadth/werkles-space-just-leased.png",
    alt: "An empty commercial space ready to be shaped into a working business",
    label: "Leave room for the business to become something real.",
    note: "A useful plan should help you picture the room, the work, and the next decision."
  },
  tools: {
    src: "/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-space-d03-tool-at-rest.png",
    alt: "A well-used tool resting on a workbench between jobs",
    label: "Good tools reduce effort. They do not add another assignment.",
    note: "Pause here, then use the next section to make or decide something concrete."
  }
} satisfies Record<BellowsVisualPauseVariant, { src: string; alt: string; label: string; note: string }>);

export function BellowsVisualPause({ variant }: { variant: BellowsVisualPauseVariant }) {
  const scene = SCENES[variant];
  return (
    <section className={`bellows-visual-pause bellows-visual-pause--${variant}`} aria-label="A visual pause in the lesson">
      <figure>
        <Image src={scene.src} alt={scene.alt} width={1280} height={800} className="bellows-visual-pause__image" />
      </figure>
      <div>
        <p className="eyebrow">Look up from the worksheet</p>
        <h2>{scene.label}</h2>
        <p>{scene.note}</p>
      </div>
    </section>
  );
}
