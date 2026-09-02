# Formation → Personal Bellows source fact-check

Date: 2026-08-22  
Foreman: Heimerdinker  
Execution context: `LOCAL_SALLY_WINDOWS`

## Status

`COMPUTER_RECEIPT_QUARANTINED__USEFUL_IDEAS_NOT_ASSIMILATED`

Computer returned a useful architectural direction, but the harvested reply was
truncated and its relay metadata is invalid. Its source claims therefore remain
advisory until checked against the local tree and reviewed by the trust/UX seats.

## Local corrections

1. `lib/werkle/formation.ts` does **not** currently export the accepted-ledger
   accessor Computer assumed. The real public helpers are
   `werkleActiveStatement(...)` and `werkleFormationSummary(...)`.
2. Current accepted summary rows carry the Formation definition/topic/status,
   but they do not expose the invented `acceptedAt`, `authorId`, or
   `sourceWorkshop` contract Computer proposed. Those fields must not be
   fabricated.
3. The Formation draft is owned by browser-local state in
   `components/werkle/formation-workbench.tsx`. Personal Bellows does not yet
   have a shared, account-backed Formation read model.
4. `components/bellows/partnership-alignment-memo.tsx` currently reads the
   Match Deck partnership-preparation context. It does not read the Formation
   ledger.
5. Private partner predictions remain isolated in session storage and are not a
   lawful input to any shared artifact or match ranking.
6. Auth/persistence changes are outside this bounded slice. Browser-local truth
   must remain explicit; no cross-device or account-save promise may appear.

## Safe implementation shape pending CBCC review

- Add a pure, versioned serializer over the **real** Formation seed + draft.
- Include only rows whose current status is `both_accepted`.
- Preserve only provenance the current model can prove: formation/candidate
  identity, topic id, exact accepted wording, current revision, and both-member
  acceptance status.
- Exclude proposed, objected, parked, withdrawn, generated, predicted, and
  private-perspective content.
- Create the browser-local Personal Bellows handoff only through an explicit
  member action; do not silently treat local draft state as an account record.
- Render the result as a revisitable `Werkle Operating Brief`, not a covenant,
  contract, legal document, or compatibility score.
- Money, ownership, tax, entity, wages, financing, valuation, exit, IP, and
  contract topics may be summarized only as accepted questions/intentions plus
  a professional-advice boundary; Werkles must not generate binding terms.

## Required proof before build assimilation

- Bean: trust/privacy/consent attack and negative-input regression matrix.
- Ender: comprehension and emotional-safety walkthrough, if its established
  route becomes available.
- Lady Jessica/Doozer: local source confirmation and implementation plan using
  the real exported types only.
- Foreman: source test proving no forbidden Formation state can enter the
  Personal Bellows artifact and reload truth remains browser-local.

No product code was changed from Computer's unvalidated response.
