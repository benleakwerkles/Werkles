"use client";

import type { SquibbRecommendationSessionSource } from "@/lib/squibb/recommendations";

type SourceDocumentPanelProps = {
  source: SquibbRecommendationSessionSource;
  selectedKind?: string;
};

export function SourceDocumentPanel({ source, selectedKind }: SourceDocumentPanelProps) {
  const doc = source.fedDocument;
  if (!doc) return null;
  const profile = source.starterProfile;

  const relevant = selectedKind
    ? doc.excerpts.filter((excerpt) => excerpt.feeds.includes(selectedKind))
    : doc.excerpts;

  if (doc.kind === "member_intake") {
    return (
      <details className="squibb-intake-readback panel">
        <summary className="squibb-fed-doc__summary-row">
          <strong>Your Working Snapshot</strong>
          <span className="squibb-fed-doc__hint">Review or correct the answers behind these ideas</span>
        </summary>
        <div className="squibb-intake-readback__body">
          <p className="squibb-intake-readback__truth" role="note">
            This Snapshot is what you told Werkles. It is not independently verified or shared automatically.
            Werkles used it to sort these options.
          </p>
          <ul className="squibb-intake-readback__answers">
            {doc.excerpts.map((excerpt, index) => (
              <li key={`${excerpt.id}-${index}`}>
                <strong>{excerpt.label}</strong>
                <span>{excerpt.text}</span>
              </li>
            ))}
          </ul>
          {profile ? (
            <section className="squibb-starter-profile" aria-labelledby="squibbStarterProfileTitle">
              <header>
                <p className="eyebrow">Starter profile — private draft</p>
                <h3 id="squibbStarterProfileTitle">What these answers could tell another Werkler</h3>
                <p>Nothing here is published or sent. Unknowns stay unknown.</p>
              </header>
              <dl>
                <div>
                  <dt>What you are making</dt>
                  <dd>{profile.project || "Not answered yet"}</dd>
                </div>
                <div>
                  <dt>Where it is today</dt>
                  <dd>{profile.stage || "Not answered yet"}</dd>
                </div>
                <div>
                  <dt>What you are working toward</dt>
                  <dd>{profile.goal || "Not answered yet"}</dd>
                </div>
                <div>
                  <dt>What you already have</dt>
                  <dd>{profile.resources.join("; ") || "Not answered yet"}</dd>
                </div>
                <div>
                  <dt>What you can offer</dt>
                  <dd>{profile.offers.join("; ") || "Not answered yet"}</dd>
                </div>
                <div>
                  <dt>What you are looking for</dt>
                  <dd>{profile.seeks.join("; ") || "Not answered yet"}</dd>
                </div>
                <div>
                  <dt>What cannot change</dt>
                  <dd>{profile.constraints.join("; ") || "Not answered yet"}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </div>
      </details>
    );
  }

  return (
      <details className="squibb-fed-doc panel">
        <summary className="squibb-fed-doc__summary-row">
          <span className="eyebrow">Source for these ratings</span>
          <strong>{doc.title}</strong>
          <span className="squibb-fed-doc__hint">
            {doc.kind === "example_fixture"
              ? "Example fixture — open to inspect"
              : "Uploaded document — open to inspect"}
          </span>
        </summary>

        <p className="squibb-fed-doc__summary">{doc.summary}</p>

        <div className="squibb-fed-doc__grid">
          <div>
            <h3>Full document</h3>
            <pre className="squibb-fed-doc__body">{doc.body}</pre>
          </div>
          <div>
            <h3>{selectedKind ? "Lines that feed this option" : "Key lines the rules used"}</h3>
            {relevant.length > 0 ? (
              <ul className="squibb-fed-doc__excerpts">
                {relevant.map((excerpt, index) => (
                  <li key={`${excerpt.id}-${index}`}>
                    <strong>{excerpt.label}</strong>
                    <span>{excerpt.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="squibb-fed-doc__empty">No excerpt is tagged to this option yet.</p>
            )}
          </div>
        </div>
      </details>
  );
}
