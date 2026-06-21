import type { ReactNode } from "react";

import type { ConciergeWalkthroughTestCase0 } from "@/lib/squibb/concierge-walkthrough-test-case-0";
import { ConfidenceMeter } from "./confidence-meter";
import { HumanGateStrip } from "./human-gate-strip";

type ConciergeWalkthroughProps = {
  walkthrough: ConciergeWalkthroughTestCase0;
};

function WalkthroughStep({
  step,
  title,
  children
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="squibb-walkthrough__step panel" aria-labelledby={`walkthroughStep${step}`}>
      <header className="squibb-walkthrough__step-head">
        <span className="squibb-walkthrough__step-num">{step}</span>
        <h2 id={`walkthroughStep${step}`}>{title}</h2>
      </header>
      <div className="squibb-walkthrough__step-body">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="squibb-walkthrough__list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function ConciergeWalkthrough({ walkthrough }: ConciergeWalkthroughProps) {
  return (
    <div className="squibb-walkthrough">
      <header className="squibb-walkthrough__hero panel">
        <p className="eyebrow">
          Squibb · Concierge Walkthrough · {walkthrough.version} · Test Case #{walkthrough.testCaseId}
        </p>
        <h1>Diagnosis before matching</h1>
        <p className="squibb-walkthrough__purpose" role="note">
          Display-only test flow. No matching. No candidates. Prove diagnosis before retrieval.
        </p>
        <dl className="squibb-walkthrough__input-block">
          <div>
            <dt>Operator input</dt>
            <dd>&ldquo;{walkthrough.input}&rdquo;</dd>
          </div>
        </dl>
      </header>

      <ol className="squibb-walkthrough__flow">
        <li>
          <WalkthroughStep step={1} title="Stated Need">
            <p className="squibb-walkthrough__quote">&ldquo;{walkthrough.statedNeed}&rdquo;</p>
          </WalkthroughStep>
        </li>

        <li>
          <WalkthroughStep step={2} title="Leverage Inventory">
            <BulletList items={walkthrough.leverageInventory} />
          </WalkthroughStep>
        </li>

        <li>
          <WalkthroughStep step={3} title="Missing Leverage Hypotheses">
            <BulletList items={walkthrough.missingLeverageHypotheses} />
          </WalkthroughStep>
        </li>

        <li>
          <WalkthroughStep step={4} title="Diagnostic Questions">
            <BulletList items={walkthrough.diagnosticQuestions} />
          </WalkthroughStep>
        </li>

        <li>
          <WalkthroughStep step={5} title="Speaker Translation">
            <p>{walkthrough.speakerTranslation}</p>
          </WalkthroughStep>
        </li>

        <li>
          <WalkthroughStep step={6} title="Recommendation Class">
            <p className="squibb-walkthrough__class-label">{walkthrough.recommendationClass.label}</p>
            <p className="squibb-walkthrough__muted">{walkthrough.recommendationClass.explanation}</p>
          </WalkthroughStep>
        </li>

        <li>
          <WalkthroughStep step={7} title="Confidence">
            <ConfidenceMeter
              score={walkthrough.confidence.score}
              label={walkthrough.confidence.label}
              why={walkthrough.confidence.why}
            />
          </WalkthroughStep>
        </li>

        <li>
          <WalkthroughStep step={8} title="Human Gate">
            <HumanGateStrip gates={walkthrough.humanGates} />
          </WalkthroughStep>
        </li>

        <li>
          <WalkthroughStep step={9} title="Smallest Reversible Next Step">
            <p className="squibb-walkthrough__next-step">{walkthrough.smallestReversibleNextStep}</p>
          </WalkthroughStep>
        </li>
      </ol>

      <footer className="squibb-walkthrough__footer panel" role="status">
        <p>
          <strong>Matching blocked.</strong> No candidate names, profiles, or intros appear in this flow. Retrieval
          unlocks only after need class is confirmed and human gates clear.
        </p>
      </footer>
    </div>
  );
}
