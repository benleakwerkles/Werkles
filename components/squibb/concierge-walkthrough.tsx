import type { ReactNode } from "react";

import type { ConciergeUser0Flow } from "@/lib/squibb/concierge-walkthrough-test-case-0";
import type { SpeakerHumanRead } from "@/lib/squibb/speaker-transparency-test-case-0";
import { ConfidenceMeter } from "./confidence-meter";
import { HumanGateStrip } from "./human-gate-strip";

const FLOW_STEPS = [
  { id: "symptom", label: "Your symptom" },
  { id: "think", label: "Speaker's read" },
  { id: "why", label: "Why" },
  { id: "wrong", label: "Prove wrong" },
  { id: "test", label: "Your test" }
] as const;

type ConciergeWalkthroughProps = {
  walkthrough: ConciergeUser0Flow;
  speakerRead?: SpeakerHumanRead;
};

function FlowRail() {
  return (
    <nav className="concierge-flow-rail" aria-label="60-second diagnosis">
      <ol className="concierge-flow-rail__list">
        {FLOW_STEPS.map((step, index) => (
          <li key={step.id} className="concierge-flow-rail__item">
            <span className="concierge-flow-rail__dot" aria-hidden="true">
              {index + 1}
            </span>
            <span className="concierge-flow-rail__label">{step.label}</span>
            {index < FLOW_STEPS.length - 1 ? (
              <span className="concierge-flow-rail__arrow" aria-hidden="true">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function FlowCard({
  step,
  title,
  variant = "default",
  children
}: {
  step: number;
  title: string;
  variant?: "default" | "symptom" | "speaker" | "why" | "falsify" | "test";
  children: ReactNode;
}) {
  return (
    <section
      className={`concierge-flow-card concierge-flow-card--${variant} panel`}
      aria-labelledby={`flowCard${step}`}
    >
      <header className="concierge-flow-card__head">
        <span className="concierge-flow-card__step">{step}</span>
        <h2 id={`flowCard${step}`}>{title}</h2>
      </header>
      <div className="concierge-flow-card__body">{children}</div>
    </section>
  );
}

export function ConciergeWalkthrough({ walkthrough, speakerRead }: ConciergeWalkthroughProps) {
  const { symptom, reversibleTest, recommendation } = walkthrough;

  return (
    <div className="concierge-user-flow concierge-user-flow--60s">
      <header className="concierge-user-flow__hero panel">
        <p className="eyebrow">Squibb · User #{walkthrough.testCaseId} · 60-second read</p>
        <h1>What is actually going on?</h1>
        <p className="concierge-user-flow__lead">
          Five cards. No matching. No candidate list.
        </p>
      </header>

      <FlowRail />

      <div className="concierge-user-flow__steps">
        <FlowCard step={1} title="What is my symptom?" variant="symptom">
          <blockquote className="concierge-symptom__quote">&ldquo;{symptom.quote}&rdquo;</blockquote>
          <p className="concierge-symptom__plain">{symptom.inPlainTerms}</p>
        </FlowCard>

        {speakerRead ? (
          <>
            <FlowCard step={2} title="What does Speaker think?" variant="speaker">
              <p className="concierge-speaker-headline">{speakerRead.speakersRead.headline}</p>
              <p className="concierge-speaker-summary">{speakerRead.speakersRead.summary}</p>
              <div className="concierge-speaker-confidence">
                <ConfidenceMeter
                  score={speakerRead.confidence.score}
                  label={speakerRead.confidence.label}
                  why={speakerRead.confidence.why}
                />
              </div>
            </FlowCard>

            <FlowCard step={3} title="Why does Speaker think it?" variant="why">
              <ul className="concierge-bullet-list">
                {speakerRead.whySpeakerThinksThis.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              <div className="concierge-alt-chips">
                <p className="concierge-alt-chips__label">Other plausible reads</p>
                <ul className="concierge-alt-chips__list">
                  {speakerRead.alternativeHypotheses.map((alt) => (
                    <li key={alt.id} className="concierge-alt-chip">
                      <strong>{alt.title}</strong>
                      <span>{alt.plainEnglish}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FlowCard>

            <FlowCard step={4} title="What would prove Speaker wrong?" variant="falsify">
              <ul className="concierge-bullet-list concierge-bullet-list--falsify">
                {speakerRead.wouldProveWrong.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </FlowCard>
          </>
        ) : null}

        <FlowCard step={5} title="What is the smallest reversible test?" variant="test">
          <p className="concierge-test-action__action">{reversibleTest.action}</p>
          <p className="concierge-test-action__meta">{reversibleTest.timeCost}</p>
          <p className="concierge-test-learning-inline">{reversibleTest.expectedLearning}</p>

          <details className="concierge-test-prompts">
            <summary>Three questions if you want them</summary>
            <ol className="concierge-experiment-list">
              {reversibleTest.prompts.map((prompt, index) => (
                <li key={prompt.id} className="concierge-experiment-card">
                  <span className="concierge-experiment-card__num">{index + 1}</span>
                  <p className="concierge-experiment-card__question">{prompt.question}</p>
                </li>
              ))}
            </ol>
          </details>
        </FlowCard>
      </div>

      <footer className="concierge-user-flow__footer panel">
        <HumanGateStrip gates={recommendation.humanGates} variant="compact" />
      </footer>
    </div>
  );
}
