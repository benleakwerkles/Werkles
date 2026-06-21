import { copy } from "@/lib/copy";

export function DiscoveryMechanism() {
  const { startWhereYouAre, discovery } = copy.home.anyone;

  return (
    <>
      <section className="discovery-mechanism" aria-labelledby="startWhereYouAreTitle">
        <div className="discovery-mechanism__intro">
          <p className="eyebrow">{startWhereYouAre.eyebrow}</p>
          <h2 id="startWhereYouAreTitle">{startWhereYouAre.headline}</h2>
          <p>{startWhereYouAre.body}</p>
          <p>{startWhereYouAre.closing}</p>
        </div>
      </section>

      <section className="discovery-mechanism discovery-mechanism--examples" aria-labelledby="discoveryTitle">
        <div className="discovery-mechanism__intro">
          <p className="eyebrow">{discovery.eyebrow}</p>
          <h2 id="discoveryTitle">{discovery.headline}</h2>
        </div>
        <ul className="discovery-mechanism__lines">
          {discovery.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="discovery-mechanism__closing">{discovery.closing}</p>
      </section>
    </>
  );
}
