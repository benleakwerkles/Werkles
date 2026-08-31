const PRACTICE_BOUNDARIES = Object.freeze([
  Object.freeze({ label: "Source", value: "Browser-local practice Werkle on this device—not an account-saved record" }),
  Object.freeze({ label: "Included", value: "Only wording both practice records accepted" }),
  Object.freeze({ label: "Left out", value: "Private notes, predictions, proposals, objections, and parked or withdrawn material" }),
  Object.freeze({ label: "Restore rule", value: "Shown again only when it still matches the current accepted wording" }),
  Object.freeze({ label: "Status", value: "Practice summary—not an agreement" }),
  Object.freeze({ label: "Providers", value: "No identity, funds, payment, phone, or background provider is active here" })
]);

export function PracticeBoundaryReadout({ titleId }: { titleId: string }) {
  return (
    <aside className="practice-boundary-readout" aria-labelledby={titleId}>
      <header>
        <p>What Werkles used</p>
        <h3 id={titleId}>Know exactly what is—and is not—in this practice brief.</h3>
      </header>
      <dl>
        {PRACTICE_BOUNDARIES.map((boundary) => (
          <div key={boundary.label}>
            <dt>{boundary.label}</dt>
            <dd>{boundary.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
