import Link from "next/link";

import { narrativeArcPages } from "@/lib/narrative-arc";

type Props = {
  currentSlug: string;
};

/* Visitor-facing moment words instead of internal codenames; the rail's
   left-to-right order IS the numbering — printing "Act N" on an ordered
   rail was redundant (Ender narrative synthesis, 2026-07-31). */
const railLabels: Record<string, string> = {
  spark: "The story",
  space: "The room",
  forge: "The people",
  foundry: "The proof"
};

export function NarrativeJourneyRail({ currentSlug }: Props) {
  return (
    <nav className="narrative-journey-rail" aria-label="The Werkles story, in order">
      <ol className="narrative-journey-rail__list">
        {narrativeArcPages.map((page) => {
          const isCurrent = page.slug === currentSlug;
          return (
            <li
              key={page.id}
              className={`narrative-journey-rail__item${isCurrent ? " narrative-journey-rail__item--current" : ""}`}
            >
              <Link href={page.slug} aria-current={isCurrent ? "page" : undefined}>
                <span className="narrative-journey-rail__label">{railLabels[page.id] ?? page.id}</span>
              </Link>
            </li>
          );
        })}
        <li className="narrative-journey-rail__item">
          <Link href="/bellows">
            <span className="narrative-journey-rail__label">Bellows</span>
          </Link>
        </li>
      </ol>
    </nav>
  );
}
