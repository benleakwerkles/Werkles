import Link from "next/link";

import { AssumptionTestCard } from "@/components/bellows/assumption-test-card";
import { BellowsVisualPause, type BellowsVisualPauseVariant } from "@/components/bellows/bellows-visual-pause";
import { CompanyStarterFloorBoard } from "@/components/bellows/company-starter-floor-board";
import { ConstraintMapCard } from "@/components/bellows/constraint-map-card";
import { EvidenceBriefBuilder } from "@/components/bellows/evidence-brief-builder";
import { PartnershipAlignmentMemo } from "@/components/bellows/partnership-alignment-memo";
import { SupplierComparisonCard } from "@/components/bellows/supplier-comparison-card";
import type { BellowsLesson } from "@/lib/bellows/operator-library";

export function BellowsLessonContent({
  lesson,
  lessonNumber,
  returnHref,
  returnLabel
}: {
  lesson: BellowsLesson;
  lessonNumber: number;
  returnHref: string;
  returnLabel: string;
}) {
  const isEvidenceLesson = lesson.slug === "proof-before-reliance";
  const isAssumptionLesson = lesson.slug === "assumption-test-design";
  const visualVariant: BellowsVisualPauseVariant = lessonNumber % 3 === 1 ? "workspace" : lessonNumber % 3 === 2 ? "people" : "tools";

  return (
    <>
      <article className="bellows-lesson">
        <header className="bellows-lesson__header">
          <span className="bellows-lesson__number">Lesson {lessonNumber}</span>
          <p className="eyebrow">{lesson.eyebrow}</p>
          <h1>{lesson.title}</h1>
          <p className="bellows-lesson__promise">{lesson.promise}</p>
        </header>
        <div className="bellows-lesson__body">
          <section><h2>The attractive shortcut</h2><p>{lesson.pattern}</p></section>
          <section className="bellows-lesson__truth"><h2>What holds up</h2><p>{lesson.truth}</p></section>
          <section><h2>Where it breaks</h2><ul>{lesson.breaks.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><h2>Questions worth carrying</h2><ol>{lesson.questions.map((question) => <li key={question}>{question}</li>)}</ol></section>
        </div>
        <div className="bellows-lesson__action">
          <div><p className="eyebrow">Fifteen-minute move</p><p>{lesson.action}</p></div>
          <p className="bellows-lesson__boundary">{lesson.boundary}</p>
        </div>
      </article>

      <BellowsVisualPause variant={visualVariant} />

      {isEvidenceLesson ? (
        <>
          <section className="bellows-evidence-examples" aria-labelledby="evidenceExamplesTitle">
            <header><p className="eyebrow">See the boundary</p><h2 id="evidenceExamplesTitle">One useful brief. One dangerous shortcut.</h2></header>
            <article className="bellows-evidence-example bellows-evidence-example--works">
              <p className="eyebrow">Worked example</p>
              <h3>“This machine may support two more jobs each week.”</h3>
              <p><strong>Supported:</strong> three dated customer requests and two current equipment quotes.</p>
              <p><strong>Still inferred:</strong> that the requests become recurring paid work.</p>
              <p><strong>Next check:</strong> rent for one job, record time and margin, then revisit the buying decision.</p>
            </article>
            <article className="bellows-evidence-example bellows-evidence-example--fails">
              <p className="eyebrow">Hostile example</p>
              <h3>“The seller showed a real license, so the deal is safe.”</h3>
              <p>A document can be authentic yet stale, out of scope, or unrelated to performance. Identity, license, funds, and character are different claims. This brief must stop at the contradiction or missing check.</p>
            </article>
          </section>
          <EvidenceBriefBuilder />
        </>
      ) : null}

      {isAssumptionLesson ? (
        <>
          <section className="bellows-evidence-examples" aria-labelledby="assumptionExamplesTitle">
            <header><p className="eyebrow">See the boundary</p><h2 id="assumptionExamplesTitle">One decision test. One applause trap.</h2></header>
            <article className="bellows-evidence-example bellows-evidence-example--works">
              <p className="eyebrow">Worked example</p>
              <h3>“Three local shops will pay for a two-week parts-delivery pilot.”</h3>
              <p><strong>Test:</strong> offer ten qualifying shops the same real price, service area, and response time.</p>
              <p><strong>Rule set first:</strong> proceed at three paid pilots, revise at one or two, stop at zero.</p>
              <p><strong>Still unknown:</strong> repeat demand, route density, and long-term margin.</p>
            </article>
            <article className="bellows-evidence-example bellows-evidence-example--fails">
              <p className="eyebrow">Hostile example</p>
              <h3>“Eight friends said they love it, so the market is proven.”</h3>
              <p>Encouragement is not the buying behavior named in the assumption. Without a realistic audience, price, action, threshold, and deadline, the result cannot change the business decision honestly.</p>
            </article>
          </section>
          <AssumptionTestCard />
        </>
      ) : null}

      {lesson.slug === "supplier-comparison" ? <SupplierComparisonCard /> : null}
      {lesson.slug === "partnership-alignment" ? <PartnershipAlignmentMemo /> : null}
      {lesson.slug === "company-starter-floor" ? <CompanyStarterFloorBoard /> : null}
      {lesson.slug === "pitch-is-not-the-plan" ? <ConstraintMapCard /> : null}

      <footer className="bellows-library__next">
        <div><p className="eyebrow">Put it to work</p><h2>Keep the useful work with the path that led you here.</h2></div>
        <div className="actions"><Link className="button button-dark" href={returnHref}>{returnLabel}</Link></div>
      </footer>
    </>
  );
}
