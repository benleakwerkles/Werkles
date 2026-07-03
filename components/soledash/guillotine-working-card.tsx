"use client";



import { AdvancedDetails } from "@/components/soledash/advanced-details";

import { ConflictVisibilityBadge } from "@/components/soledash/conflict-visibility-badge";

import { ProvenanceLabel } from "@/components/soledash/provenance-label";

import { cosmeticConflictDisplay } from "@/lib/soledash/conflict-visibility/cosmetic-display";

import { CLEAR_CONFLICT_VISIBILITY } from "@/lib/soledash/conflict-visibility/types";

import type { GuillotineCard } from "@/lib/soledash/guillotine/types";

import {

  loopStateSlug,

  sendReceiveFromCard,

  type WorkbenchLoopState

} from "@/lib/soledash/guillotine/send-receive-surface";

import {

  workingClickOutcome,

  workingOwnerLine,

  workingWaitingNext,

  workingWhatIsThis

} from "@/lib/soledash/guillotine/working-card-copy";



const LOOP_LABELS: Record<WorkbenchLoopState, string> = {

  DRAFT: "Draft",

  SENT: "Sent",

  RECEIVED: "Received",

  FAILED: "Failed",

  RELAY_REJECTED: "Rejected"

};



export function GuillotineWorkingCard({ card, conflictIndex = 0 }: { card: GuillotineCard; conflictIndex?: number }) {

  const loop = sendReceiveFromCard(card);

  const slug = loopStateSlug(loop.loopState);

  const conflict = card.conflict ?? cosmeticConflictDisplay(card, conflictIndex);



  return (

    <article className={`sd-work-card sd-work-card--loop-${slug}`}>

      <header className="sd-work-card__banner">

        <div className="sd-work-card__banner-main">

          <span className={`sd-work-card__loop sd-work-card__loop--${slug}`}>{LOOP_LABELS[loop.loopState]}</span>

          <h3 className="sd-work-card__title">{card.title}</h3>

        </div>

        <ConflictVisibilityBadge conflict={conflict ?? CLEAR_CONFLICT_VISIBILITY} />

      </header>



      <p className="sd-work-card__identity">{workingWhatIsThis(card)}</p>



      <section className="sd-work-card__loop-panel" aria-label="Send receive loop">

        {loop.sendLabel ? <p className="sd-work-card__send">{loop.sendLabel}</p> : null}

        {loop.loopState === "RELAY_REJECTED" && loop.response ? (

          <div className="sd-work-card__response sd-work-card__response--relay-rejected" role="status">

            {loop.response}

          </div>

        ) : loop.response ? (

          <div

            className={`sd-work-card__response sd-work-card__response--${slug}`}

            role={loop.loopState === "RECEIVED" || loop.loopState === "FAILED" ? "status" : undefined}

          >

            {loop.response}

          </div>

        ) : null}

        {loop.loopState === "RELAY_REJECTED" && loop.relayRejection ? (

          <AdvancedDetails className="sd-work-card__relay-reject" summary="Rejection details">

            <dl className="sd-work-card__relay-reject-facts">

              <div>

                <dt>Reason code</dt>

                <dd>

                  <code>{loop.relayRejection.reasonCode}</code>

                </dd>

              </div>

              <div>

                <dt>Sender</dt>

                <dd>{loop.relayRejection.sender}</dd>

              </div>

              <div>

                <dt>Expected recipient</dt>

                <dd>{loop.relayRejection.expectedRecipient}</dd>

              </div>

              <div>

                <dt>Packet ID</dt>

                <dd>

                  <code>{loop.relayRejection.packetId}</code>

                </dd>

              </div>

            </dl>

          </AdvancedDetails>

        ) : null}

        {loop.nextHint && loop.loopState !== "RECEIVED" && loop.loopState !== "RELAY_REJECTED" ? (

          <p className="sd-work-card__next">{loop.nextHint}</p>

        ) : null}

        {loop.loopState === "RECEIVED" && loop.nextHint ? (

          <p className="sd-work-card__next">{loop.nextHint}</p>

        ) : null}

      </section>



      <AdvancedDetails className="sd-work-card__advanced" summary="Technical details">

        <dl className="sd-work-card__facts">

          <div>

            <dt>Card ID</dt>

            <dd>

              <code>{card.cardId}</code>

            </dd>

          </div>

          <div>

            <dt>Owner</dt>

            <dd>{workingOwnerLine(card)}</dd>

          </div>

          <div>

            <dt>Project</dt>

            <dd>{card.project}</dd>

          </div>

          <div>

            <dt>Area</dt>

            <dd>{card.area}</dd>

          </div>

          <div>

            <dt>Branch</dt>

            <dd>{card.branch}</dd>

          </div>

          {loop.technical.map((line) => (

            <div key={`${line.label}:${line.value}`} className="sd-work-card__wide">

              <dt>{line.label}</dt>

              <dd>

                <code>{line.value}</code>

              </dd>

            </div>

          ))}

        </dl>

        <dl className="sd-work-card__clarity sd-work-card__clarity--collapsed">

          <div className="sd-work-card__clarity-row">

            <dt>What happens if I click?</dt>

            <dd>{workingClickOutcome(card)}</dd>

          </div>

          <div className="sd-work-card__clarity-row">

            <dt>What is waiting next?</dt>

            <dd>{workingWaitingNext(card)}</dd>

          </div>

        </dl>

        <ProvenanceLabel provenance={card.provenance} compact className="sd-work-card__prov" />

      </AdvancedDetails>

    </article>

  );

}
