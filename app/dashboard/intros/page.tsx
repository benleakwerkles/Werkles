import Image from "next/image";
import Link from "next/link";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { DashboardAuthGuard } from "@/components/foundry/dashboard-auth-guard";
import { SiteIcon } from "@/components/foundry/site-icon";
import { AccountAwareGhostMemberLab } from "@/components/ghost-fleet/account-aware-ghost-member-lab";
import { AccountAwareIntrosReadout } from "@/components/ghost-fleet/account-aware-intros-readout";
import { buildGhostInteractionMember } from "@/lib/ghost-fleet/interaction";
import { isGhostFleetEnabled, listGhostMembers, matchGhostsForOwner } from "@/lib/ghost-fleet";
import { loadRecommendationView } from "@/lib/recommendation-view/model";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Match Deck | Werkles",
  description: "Explore the kinds of people who may fit what you are building and why."
};

export default async function IntrosPage() {
  const fleetOn = isGhostFleetEnabled();
  const ownerId = await readBellowsOwnerIdFromCookies();
  const view = await loadRecommendationView(ownerId);
  const ghostMatches = fleetOn && ownerId ? await matchGhostsForOwner(ownerId, 9) : null;
  const fleetMembers = fleetOn ? await listGhostMembers() : [];
  const fleetById = new Map(fleetMembers.map((member) => [member.id, member]));
  const interactionMembers = (ghostMatches?.candidates ?? []).flatMap((candidate) => {
    const member = fleetById.get(candidate.ghostId);
    if (!member) return [];
    const interaction = buildGhostInteractionMember(member, {
      rank: candidate.rank,
      orderReason: candidate.orderReason,
      proximityLabel: candidate.proximity.label,
      reasons: candidate.reasons,
      cautions: candidate.blockers,
      snapshotNeed: view.askedFor.summary
    });
    return interaction ? [interaction] : [];
  });

  return (
    <CockpitShell>
      <main className="dashboard-main route-room route-room--people workshop-route--people">
        <DashboardAuthGuard next="/dashboard/intros" allowGhostWalkthrough={fleetOn}>
          <div className="recview">
            <section className="ops-card recview__header recview__people-hero">
              <div className="recview__people-copy">
                <div className="card-heading product-heading">
                  <SiteIcon icon="product-intros" size="lg" className="site-icon--product" />
                  <div className="product-heading__copy"><p>Your Match Deck</p><h1>People worth a closer look.</h1></div>
                </div>
                <p>Start with shared goals, useful differences, and a reason to talk. Money and proof come later when the work actually calls for them.</p>
              </div>
              <figure className="recview__people-photo">
                <Image src="/assets/draft/people-v1/people-partners-clipboard.png" alt="Two people reviewing a plan together" width={900} height={600} priority />
                <figcaption>A shortlist should explain why each person is here.</figcaption>
              </figure>
            </section>

            <nav className="match-deck-journey" aria-label="From private work to possible shared work">
              <Link href="/dashboard/blueprints">
                <span>1</span><strong>My Work</strong><small>Your private plan stays yours.</small>
              </Link>
              <span aria-hidden="true">→</span>
              <Link href="#match-deck-candidates" aria-current="step">
                <span>2</span><strong>Match Deck</strong><small>Compare people and practice questions.</small>
              </Link>
              <span aria-hidden="true">→</span>
              <Link href="/dashboard/werkles/formation">
                <span>3</span><strong>Possible Werkle</strong><small>Choose together what could become shared.</small>
              </Link>
            </nav>

            <div id="match-deck-candidates">
              {fleetOn ? <AccountAwareGhostMemberLab initialMembers={interactionMembers} /> : null}
            </div>
            <AccountAwareIntrosReadout initialView={view} />
          </div>
        </DashboardAuthGuard>
      </main>
    </CockpitShell>
  );
}
