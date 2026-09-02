# WERKLES VPGM RECEIPT — Actual Werkle Formation

Date: 2026-08-21
Foreman seat: Heimerdinker / Codex on BETSY
Branch observed: `maker/site-g-20260703`
Start commit observed: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`
Workspace condition: heavily dirty before this pass; unrelated work preserved.

## V — vision packet

- `foreman/handoffs/outbox/HEIMERDINKER_V_ACTUAL_WERKLE_FORMATION_20260821.md`
- A proposed Werkle must preserve both source Workshops, require exact two-person consent, keep disagreements visible, exclude private/parked/disputed material from the shared floor, and turn friction into contextual Bellows help.

## P — actual CBCC participation

- Computer / Thufir received the pre-build packet and returned `PATCH`:
  - `foreman/handoffs/inbox/FROM_COMPUTER_ACTUAL_WERKLE_FORMATION_20260821_20260821-173051.md`
  - custody label: `RECEIVED_WITHOUT_CUSTODY_CHALLENGE`
- Computer / Thufir received the post-build packet and returned `PASS with two carryover items`:
  - `foreman/handoffs/inbox/FROM_COMPUTER_ACTUAL_WERKLE_FORMATION_POSTBUILD_20260821_20260821-174057.md`
  - carryovers: withdraw a pending proposal; preserve objection history after later agreement.
- Both carryovers were implemented and independently browser-walked after that receipt.
- A final seal packet was prepared, but the Computer CDP route timed out before accepted dispatch. No final seal response is claimed.
- Ender desktop was attempted earlier in the pass but returned no usable review. No Ender participation is claimed.

## G — strongest ideas built

1. **Provenance and exact consent:** twelve formation topics retain both source statements and their origin. Only one exact, mutually accepted revision enters the shared floor.
2. **A real formation workbench:** the tester can walk both synthetic sides, decide what carries over, combine wording, keep material private, park it, object, accept, rewrite, or withdraw.
3. **Substantial help at the friction point:** responsibilities, decision rights, contributions, money, proof, exit, IP, confidentiality, and unknowns link into the relevant Bellows material without generating legal, tax, financing, employment, or ownership answers.

## M — momentum added

1. Match Deck carries the exact selected eligible synthetic member into formation; arbitrary candidate IDs fail back to an eligible ranked match.
2. Pending choices can be withdrawn. Full retained history preserves the old objection even after later mutual agreement. Browser/device-only custody is stated plainly.
3. A real browser walk caught stale Next development chunks returning 404. The local dev server was restarted and client hydration was re-proved with actual controls, not only visible server text.

## Files in this slice

- `app/dashboard/werkles/formation/page.tsx`
- `app/dashboard/werkles/formation/werkle-formation.css`
- `components/werkle/formation-workbench.tsx`
- `lib/werkle/formation.ts`
- `components/ghost-fleet/ghost-member-interaction-lab.tsx`
- `components/workshop/ghost-werkle-preview.tsx`
- `lib/site-nav.ts`
- `scripts/foreman/werkle-formation-contract-smoke.ts`

## Verification

- `npm run typecheck` — PASS
- formation contract smoke — PASS
- sitewide header continuity — PASS: 77 rendered routes; 74 ordinary shared-header routes; 3 explicit exceptions
- `npm run build` — PASS, exit 0; 101 static pages generated; `/dashboard/werkles/formation` included
- real browser:
  - 12 topics, no error overlay
  - selected Match Deck candidate carried into the formation room
  - rewrite reset both approvals
  - shared floor changed only after both exact approvals
  - disputed and parked topics stayed out
  - pending answer withdrawal recorded in history
  - objection note remained after later `Both accepted`
  - reload restored the local-device draft
  - final dev-server reload hydrated successfully with no page errors

## Honest edge

This is a substantial synthetic, local-device formation walk. It does not yet create a production company, contact a real match, merge account records, save across devices, form a legal entity, generate a contract, or claim adviser approval. No push, deploy, commit, schema migration, secrets change, provider production action, or spend was performed.
