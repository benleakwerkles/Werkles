import Image from "next/image";

import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";
import { ConciergeIntakeForm } from "@/components/squibb/concierge-intake-form";
import { isGhostFleetEnabled } from "@/lib/ghost-fleet/enabled";
import { readLatestSpeakerIntakeForOwner } from "@/lib/squibb/concierge-intake-storage";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";
import { EMPTY_INTAKE_ANSWERS, type ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";

import "./concierge-intake.css";

export const metadata = {
  title: "Tell Werkles What You Are Building",
  description: "Describe what is stuck so Werkles can recommend a practical next step."
};

export default async function ConciergeIntakePage() {
  const ownerId = await readBellowsOwnerIdFromCookies();
  const recoverableLocalIntake = ownerId
    ? await readLatestSpeakerIntakeForOwner(ownerId)
    : isGhostFleetEnabled()
      ? await readLatestSpeakerIntakeForOwner("member_dev-preview-user")
      : null;
  const initialAnswers = recoverableLocalIntake?.packet.symptoms.reduce<ConciergeIntakeAnswers>(
    (next, symptom) => ({ ...next, [symptom.id]: symptom.answer }),
    { ...EMPTY_INTAKE_ANSWERS }
  );

  return (
    <>
      <LocalAwareSiteHeader />
      <main className="bellows-main narrative-act-page workshop-route--bellows concierge-intake-page">

        <section className="panel concierge-intake-page__guide" aria-labelledby="intakeGuideTitle">
          <div className="concierge-intake-page__guide-copy">
            <p className="eyebrow">Start here</p>
            <h2 id="intakeGuideTitle">Tell us what you are making and what is stuck.</h2>
            <ol>
              <li>Answer in ordinary words.</li>
              <li>Werkles builds a working Snapshot you can correct.</li>
              <li>The same Snapshot shapes next moves and possible people.</li>
            </ol>
          </div>
          <figure className="concierge-intake-page__guide-photo">
            <Image
              src="/assets/draft/people-v1/people-boxes-through-door.jpg"
              alt="A business owner carrying supplies into a new storefront"
              width={1536}
              height={1024}
              sizes="(max-width: 760px) 100vw, 42vw"
              priority
            />
            <figcaption>Bring us the real starting point. It does not have to sound polished.</figcaption>
          </figure>
        </section>

        {recoverableLocalIntake ? (
          <section className="panel concierge-intake-page__recovery" aria-labelledby="localRecoveryTitle">
            <p className="eyebrow">Continue where you left off</p>
            <h2 id="localRecoveryTitle">Your last Intake is still here.</h2>
            <p>Pick up where you stopped without typing it again.</p>
            <p>This recovery copy is saved in this browser on this device, not to your Werkles account.</p>
            <form action="/api/bellows/intake/recover-local" method="post">
              <button className="button button-dark" type="submit">Continue with my last Intake</button>
            </form>
          </section>
        ) : null}

        <ConciergeIntakeForm initialAnswers={initialAnswers} />
      </main>
      <footer className="site-footer">
        <p>Werkles helps you compare possible next steps. It does not guarantee funding, verification, legal clearance, or a particular outcome.</p>
      </footer>
    </>
  );
}
