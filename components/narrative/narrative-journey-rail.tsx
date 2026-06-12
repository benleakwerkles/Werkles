import Link from "next/link";

import { narrativeArcPages } from "@/lib/narrative-arc";

type Props = {
  currentSlug: string;
};

export function NarrativeJourneyRail({ currentSlug }: Props) {
  return (
    <nav className="narrative-journey-rail" aria-label="Four-act narrative journey">
      <ol className="narrative-journey-rail__list">
        {narrativeArcPages.map((page) => {
          const isCurrent = page.slug === currentSlug;
          return (
            <li
              key={page.id}
              className={`narrative-journey-rail__item${isCurrent ? " narrative-journey-rail__item--current" : ""}`}
            >
              <Link href={page.slug} aria-current={isCurrent ? "page" : undefined}>
                <span className="narrative-journey-rail__act">Act {page.act}</span>
                <span className="narrative-journey-rail__label">{page.id}</span>
              </Link>
            </li>
          );
        })}
        <li className="narrative-journey-rail__item">
          <Link href="/bellows">
            <span className="narrative-journey-rail__act">Guide</span>
            <span className="narrative-journey-rail__label">Bellows</span>
          </Link>
        </li>
      </ol>
    </nav>
  );
}
