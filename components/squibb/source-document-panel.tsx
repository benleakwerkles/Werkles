import type { SquibbRecommendationSessionSource } from "@/lib/squibb/recommendations";

type SourceDocumentPanelProps = {
  source: SquibbRecommendationSessionSource;
  selectedKind?: string;
};

export function SourceDocumentPanel({ source, selectedKind }: SourceDocumentPanelProps) {
  const document = source.fedDocument;
  if (!document) return null;

  const relevantExcerpts = selectedKind
    ? document.excerpts.filter((excerpt) => excerpt.feeds.includes(selectedKind))
    : document.excerpts;

  return (
    <details className="squibb-fed-doc panel">
      <summary className="squibb-fed-doc__summary-row">
        <span className="eyebrow">Source for these scores</span>
        <strong>{document.title}</strong>
        <span className="squibb-fed-doc__hint">
          {document.kind === "example_fixture"
            ? "Example - open to inspect"
            : document.kind === "member_intake"
              ? "Your intake - open to inspect"
              : "Pasted document - open to inspect"}
        </span>
      </summary>

      <p className="squibb-fed-doc__summary">{document.summary}</p>
      <div className="squibb-fed-doc__grid">
        <div>
          <h3>Full document</h3>
          <pre className="squibb-fed-doc__body">{document.body}</pre>
        </div>
        <div>
          <h3>{selectedKind ? "Lines tied to this option" : "Key lines used"}</h3>
          {relevantExcerpts.length > 0 ? (
            <ul className="squibb-fed-doc__excerpts">
              {relevantExcerpts.map((excerpt) => (
                <li key={excerpt.id}>
                  <strong>{excerpt.label}</strong>
                  <span>{excerpt.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="squibb-fed-doc__empty">No individual lines are tagged to this option yet.</p>
          )}
        </div>
      </div>
    </details>
  );
}
