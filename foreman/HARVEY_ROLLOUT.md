# Harvey Rollout

Status: ROLLOUT STARTED
Home seat: Doss
Compatibility surface: ThinkIt

## North star

Harvey lives where Ben starts. Doss is the primary capture, thinking, and resume seat. ThinkIt is Harvey's current command surface and becomes Harvey over time as real capabilities replace coordination assumptions.

## Role boundaries

- Harvey is the persistent Nerdkle counterpart under construction.
- ThinkIt remains the compatible command, status, and relay layer during migration.
- Speaker remains Harvey's durable memory authority.
- Relay remains Harvey's transport and receipt layer.
- Doss is Harvey's home seat and the default place to begin or resume work.
- Betsy is a forge and execution machine. Harvey must not depend on Betsy being online to preserve Ben's place.

## Rollout principles

1. Add Harvey paths before retiring ThinkIt paths.
2. Preserve existing packet identities, receipts, hashes, and return matching.
3. Log work transitions and outcomes, not private content or every keystroke.
4. Prefer short bounded jobs with explicit checkpoints and cheap recovery.
5. Treat interruption, abandonment, mistakes, and restart as normal workflow states.
6. Do not call launch, queue, or SENT completion. Preserve receiver-side proof rules.

## Phase 1 — home seat

- [x] Add `/harvey` as the forward-facing entry.
- [x] Keep `/thinkit` operational as a compatibility path.
- [x] Declare Doss as Harvey's home seat in repo truth.
- [x] Preserve `ThinkIt@Betsy` relay identity until a receipt-safe migration exists.
- [ ] Add a local PowerToys workspace launch receipt on Doss.
- [ ] Add a concise resume surface: last session, active task, last outcome, next bounded move.

## Later phases

- Make workspace receipts readable without Betsy.
- Roll receipts up to Betsy when it is available; never make that roll-up a start-work dependency.
- Migrate internal ThinkIt labels only after relay, status, and origin-return compatibility are proven.
- Retire the ThinkIt name only through an explicit compatibility and proof review.

## Proof boundary

This rollout establishes naming, home-seat doctrine, and an additive route. It does not yet prove PowerToys logging, cross-machine collection, autonomous resumption, or a completed ThinkIt relay-identity migration.
