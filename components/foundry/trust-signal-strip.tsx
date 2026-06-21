import { enderTrustSignalMarks, type TrustSignalMarkState } from "@/lib/ender-imagery-ux";
import { copy } from "@/lib/copy";

const stateLabels: Record<TrustSignalMarkState, string> = {
  cleared: "Cleared",
  preview: "Preview",
  lapsed: "Lapsed",
  pending: "Pending"
};

export function TrustSignalStrip() {
  const { formation, trustSignals } = copy.home.anyone;

  return (
    <>
      <section className="trust-signal-strip" aria-labelledby="formationTitle">
        <div className="trust-signal-strip__intro">
          <p className="eyebrow">{formation.eyebrow}</p>
          <h2 id="formationTitle">{formation.headline}</h2>
          <p>{formation.body}</p>
        </div>
      </section>

      <section className="trust-signal-strip" aria-labelledby="trustSignalStripTitle">
        <div className="trust-signal-strip__intro">
          <p className="eyebrow">{trustSignals.eyebrow}</p>
          <h2 id="trustSignalStripTitle">{trustSignals.headline}</h2>
          <p>{trustSignals.body}</p>
          <p>{trustSignals.detail}</p>
        </div>
        <div className="trust-signal-strip__grid" role="list">
          {enderTrustSignalMarks.map((mark) => (
            <article
              key={mark.key}
              className={`trust-signal-mark trust-signal-mark--${mark.state}`}
              role="listitem"
            >
              <span className="trust-signal-mark__label">{mark.label}</span>
              <span className="trust-signal-mark__scope">{mark.appliesTo}</span>
              <span className={`trust-signal-mark__state trust-signal-mark__state--${mark.state}`}>
                {stateLabels[mark.state]}
              </span>
            </article>
          ))}
        </div>
        <p className="trust-signal-strip__note">{trustSignals.note}</p>
      </section>
    </>
  );
}
