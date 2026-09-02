import Image from "next/image";
import Link from "next/link";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { DashboardAuthGuard } from "@/components/foundry/dashboard-auth-guard";
import { SiteIcon } from "@/components/foundry/site-icon";
import { AccountAwareWorkshopState } from "@/components/workshop/account-aware-workshop-state";
import { GhostWerklePreview } from "@/components/workshop/ghost-werkle-preview";
import { WorkshopActionBoard } from "@/components/workshop/workshop-action-board";
import { OpportunityWalkthroughDoor } from "@/components/opportunities/opportunity-walkthrough-door";
import { GHOST_FLEET_DISCLOSURE, isGhostFleetEnabled } from "@/lib/ghost-fleet";
import { loadOwnerSurfaceState } from "@/lib/owner-surfaces/owner-state";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";
import { WERKLES_TERMS } from "@/lib/membership-value-ladder";

export const dynamic = "force-dynamic";

const workshopFurniture = [
  ["01", "The plan board", "Review the goal, blocker, and open questions Werkles carried forward from your latest Intake.", "Review My Plan", "/dashboard/blueprints#current-workshop"],
  ["02", "Working drafts", "Reopen the checklists, comparisons, and decision tools you started in your Personal Bellows.", "Open My Drafts", "/bellows/personal#my-bellows-work"],
  ["03", "Possible shared work", "Explore how two Workshops could become one Werkle without silently merging either person’s work.", "Practice a Werkle", "/dashboard/werkles/formation"]
] as const;

export default async function BlueprintsPage() {
  const fleetOn = isGhostFleetEnabled();
  const state = await loadOwnerSurfaceState(await readBellowsOwnerIdFromCookies());

  return (
    <CockpitShell>
      <main className="dashboard-main workshop-page route-room route-room--workshop workshop-route--dashboard">
        <DashboardAuthGuard next="/dashboard/blueprints" allowGhostWalkthrough={fleetOn}>
        <section className="workshop-hero" aria-labelledby="workshop-title">
          <div className="workshop-hero__copy">
            <p className="workshop-eyebrow">Your working room</p>
            <h1 id="workshop-title">Turn the tangled version into a plan you can use.</h1>
            <p className="workshop-hero__lede">
              Intake gives Werkles the raw material. Your Workshop lays it out, shows the gaps, and helps you decide
              what comes next before money, partners, or introductions make the stakes higher.
            </p>
            <div className="member-selected-surface__actions">
              <Link className="button button-dark" href="#action-plan">
                Build or Review My Action Plan
              </Link>
              <Link className="button button-outline" href="/bellows/intake">Review My Answers</Link>
            </div>
          </div>
          <div className="workshop-hero__artifact" aria-hidden="true">
            <span className="workshop-hero__orbit workshop-hero__orbit--outer" />
            <span className="workshop-hero__orbit workshop-hero__orbit--inner" />
            <SiteIcon icon="product-workshop" size="lg" className="site-icon--product workshop-hero__icon" />
            <span className="workshop-hero__tag workshop-hero__tag--goal">Goal</span>
            <span className="workshop-hero__tag workshop-hero__tag--gap">Gap</span>
            <span className="workshop-hero__tag workshop-hero__tag--move">Next move</span>
          </div>
          <div className="workshop-hero__status" role="note">
            <strong>Your answers stay correctable.</strong>
            <span>Werkles checks for the latest Intake tied to this sign-in before showing the working plan. Nothing here is sent or shared.</span>
          </div>
        </section>

        <div id="action-plan">
          <WorkshopActionBoard />
        </div>

        {fleetOn ? <OpportunityWalkthroughDoor surface="workshop" /> : null}

        <section className="workshop-people-door" aria-labelledby="workshop-people-title">
          <div>
            <p className="workshop-eyebrow">People for this work</p>
            <h2 id="workshop-people-title">See who might make the plan stronger.</h2>
            <p>
              Your Workshop holds the work. The People page compares possible collaborators against that work and
              explains why each person may—or may not—fit.
            </p>
          </div>
          <Link className="button button-dark" href="/dashboard/intros">Compare people</Link>
        </section>

        <div id="current-workshop">
          <AccountAwareWorkshopState initialState={state} />
        </div>

        <GhostWerklePreview />

        <section className="workshop-room" aria-labelledby="workshop-room-title">
          <div className="workshop-section-heading">
            <p>Inside the room</p>
            <h2 id="workshop-room-title">Use the work already in your Workshop.</h2>
            <span>Open the plan, drafts, people, or shared-work practice without leaving this room cold.</span>
          </div>
          <div className="workshop-room__grid">
            {workshopFurniture.map(([number, title, body, action, href]) => (
              <article className="workshop-room__card" key={title}>
                <span className="workshop-room__number">{number}</span><h3>{title}</h3><p>{body}</p>
                <Link className="workshop-room__open" href={href}>{action} →</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="workshop-formation" aria-labelledby="workshop-formation-title">
          <div className="workshop-section-heading">
            <p>When one becomes more</p>
            <h2 id="workshop-formation-title">Your Workshop becomes a Werkle when the work becomes shared.</h2>
          </div>
          <div className="workshop-formation__steps">
            <article>
              <span>1 person</span>
              <h3>{WERKLES_TERMS.workshop.term}</h3>
              <p>{WERKLES_TERMS.workshop.definition}</p>
            </article>
            <span className="workshop-formation__join" aria-hidden="true">+</span>
            <article>
              <span>2 or more Werklers</span>
              <h3>{WERKLES_TERMS.werkle.term}</h3>
              <p>{WERKLES_TERMS.werkle.definition}</p>
            </article>
          </div>
          <p className="workshop-formation__note">Connecting does not merge your entire account. A Werkle holds only the work its participants choose to share.</p>
        </section>

        <figure className="workshop-human-break">
          <Image
            src="/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-space-d05-van-dawn.png"
            alt="The open back of a work van organized with tools and ready for the day"
            width={1536}
            height={864}
            sizes="(max-width: 900px) 100vw, 1200px"
            priority
          />
          <figcaption>A useful plan should eventually look like work that is ready to begin.</figcaption>
        </figure>

        <section className="workshop-wayfinding" aria-labelledby="workshop-wayfinding-title">
          <div>
            <p className="workshop-eyebrow">Keep the work moving</p>
            <h2 id="workshop-wayfinding-title">Leave this room with a clear next door.</h2>
            <p>Review what Werkles heard, compare the possible next moves, or meet people when a person is actually part of the answer.</p>
          </div>
          <nav aria-label="Workshop next steps">
            <Link className="button button-dark" href={state.hasIntake ? "/bellows/recommendations" : "/bellows/intake"}>
              {state.hasIntake ? "Compare My Next Moves" : "Start My Intake"}
            </Link>
            <Link className="button button-outline" href="/dashboard/intros">Open Match Deck</Link>
            <Link className="workshop-wayfinding__home" href="/dashboard">Return to Member Home</Link>
          </nav>
        </section>

        {fleetOn ? <p className="muted workshop-fleet-note" role="note">{GHOST_FLEET_DISCLOSURE}</p> : null}
        </DashboardAuthGuard>
      </main>
    </CockpitShell>
  );
}
