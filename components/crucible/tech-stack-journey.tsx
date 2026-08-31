import Link from "next/link";

import { MEMBER_TECH_STACK_JOURNEY, TECH_STACK_ACTIVATION_WAVES } from "@/lib/crucible-tech-stack-journey";

export function TechStackJourney() {
  return (
    <details className="ops-card crucible-tech-journey">
      <summary className="crucible-tech-journey__header">
        <div>
          <p className="plan-kicker">Where the technology fits</p>
          <h2 id="techStackJourneyTitle">One member journey. Different tools for different jobs.</h2>
        </div>
        <p>
          A provider name never means “trusted.” Each service gets one narrow job, one honest state, and a
          visible place in Werkles.
        </p>
        <strong>Review provider plan</strong>
      </summary>

      <div className="crucible-tech-journey__body" aria-labelledby="techStackJourneyTitle">

      <section className="crucible-tech-journey__roadmap" aria-labelledby="techStackRoadmapTitle">
        <header>
          <p className="plan-kicker">Closest useful progress</p>
          <h3 id="techStackRoadmapTitle">Four steps from today&apos;s build to real provider use.</h3>
          <p>Each step names the member benefit, what Werkles still has to prove, and what must wait for your approval.</p>
        </header>
        <ol>
          {TECH_STACK_ACTIVATION_WAVES.map((wave) => (
            <li key={wave.number}>
              <span aria-hidden="true">{wave.number}</span>
              <div>
                <h4>{wave.title}</h4>
                <p>{wave.usefulResult}</p>
                <p><strong>Werkles must prove next:</strong> {wave.nextProof}</p>
                <p><strong>Waits for:</strong> {wave.stopsBefore}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <ol className="crucible-tech-journey__stages">
        {MEMBER_TECH_STACK_JOURNEY.map((stage) => (
          <li key={stage.id}>
            <details open={stage.number === 1}>
              <summary>
                <span aria-hidden="true">{stage.number}</span>
                <div>
                  <h3>{stage.title}</h3>
                  <p>{stage.summary}</p>
                </div>
                <strong>{stage.services.length} {stage.services.length === 1 ? "service" : "services"}</strong>
              </summary>
              <ul>
                {stage.services.map((service) => (
                  <li key={service.id} data-stack-state={service.state}>
                    <div>
                      <strong>{service.name}</strong>
                      <span>{service.stateLabel}</span>
                    </div>
                    <p>{service.does}</p>
                    <p className="muted"><strong>Does not mean:</strong> {service.doesNot}</p>
                    <p><strong>Can I use this now?</strong> {service.memberAction}</p>
                    <details className="crucible-tech-journey__activation">
                      <summary>What moves this forward</summary>
                      <p><strong>Werkles must prove:</strong> {service.nextBuild}</p>
                      <p><strong>Before this can go live:</strong> {service.humanGate}</p>
                    </details>
                    <details className="crucible-tech-journey__custody">
                      <summary>Not live yet: what would happen to the data</summary>
                      <dl>
                        <div><dt>Werkles would keep</dt><dd>{service.dataBoundary.werklesKeeps}</dd></div>
                        <div><dt>Provider would handle</dt><dd>{service.dataBoundary.providerHandles}</dd></div>
                        <div><dt>Deletion or expiry</dt><dd>{service.dataBoundary.disposal}</dd></div>
                      </dl>
                    </details>
                    <Link href={service.page}>See where this lives</Link>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>

      <p className="crucible-tech-journey__truth" role="note">
        Only checks labeled available can be started. Test and sandbox activity is not live verification.
      </p>
      </div>
    </details>
  );
}
