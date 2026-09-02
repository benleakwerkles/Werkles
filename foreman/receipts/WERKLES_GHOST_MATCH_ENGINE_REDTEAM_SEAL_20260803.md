# Ghost Match Engine + Red Team Seal — 2026-08-03

Execution context: `LOCAL_SALLY_WINDOWS`. Local only. Nothing pushed, nothing deployed, no paid calls.

## What was wrong with the previous pass

The first ghost-fleet pass shipped a display layer, not a product.

1. Intros were faked. `previewIntrosForOperator` listed ghosts in file order and stamped
   `review_required` on every third one via `index % 3`. No intake was read. No person was matched.
2. The fleet was one template repeated 150 times, so any real matcher would have scored every member identically.
3. The Handeye attack only checked that a page contained the submitter's own text. It never tried to
   read another member's data, so "isolation PASS" proved nothing.
4. Handeye bot traffic wrote 67 auto-generated entries into `foreman/speaker/entries`, a human-review directory.

## What is now real

| Piece | State |
| --- | --- |
| `lib/ghost-fleet/match.ts` | Rules-only person-to-person ranking against the caller's own intake signals |
| `/api/ghost-fleet/intros` | Ranks the fleet for the cookie owner; returns `no_intake` empty state instead of a demo queue |
| `data/ghost-fleet/members.json` | 12 distinct working situations × city/number variation = 97 unique stated needs across 150 members |
| `scripts/foreman/ghost-fleet-handeye-attack.mjs` | Six adversarial assertions per ghost, including cross-owner and forged-cookie leak attempts |
| Speaker record | 67 bot entries archived out; Handeye traffic now sends `x-werkles-handeye: 1` and writes to `data/squibb/test-intakes/` |

Ranking rules, all of which produce visible reasons: capital complementarity (and a penalty when both
sides chase the same money), partnership openness, offer-to-blocker overlap, reciprocity, shared
situation language, named geography, credential coverage. Scores are capped at 92 — an unverified
synthetic member can never read as certain.

## Red team results

`node scripts/foreman/ghost-fleet-handeye-attack.mjs http://127.0.0.1:3000 25`

- 25/25 PASS, 0 fail
- Cross-owner leak attempts: clean on every run
- Forged owner cookie: never resolved to a real session
- Cookieless caller: empty state, never another member's intake
- Blocked members: never offered as candidates
- 12 distinct top scores across 25 seekers — the engine differentiates rather than ranking everyone the same

`node scripts/foreman/ghost-fleet-surface-attack.mjs http://127.0.0.1:3000` — 6/6 PASS,
including a new assertion that a cookieless intros call returns `no_intake` rather than a padded queue.

`npx tsc --noEmit` clean. `npm run build` clean, 83 pages.

## Walkthrough check by hand

Submitted a Norfolk commercial-kitchen-lease co-signer intake through `/bellows/intake` in the browser,
then loaded `/dashboard/intros`. Top three candidates came back as Backers, two of them in Norfolk,
each with its own reasons — capital posture, blocker coverage ("guarantor, lease"), and named geography.
Two rendering defects were found and fixed in the same pass: the reason lines ran together into one
unreadable string, and the situation-overlap rule was quoting filler words like "someone" back as
evidence. Reasons now render as separate labelled lines and filler tokens are filtered out.

## Second pass — Workshop, Proof, and Dues wired to the same owner state

Operator picked closing the display-only gap over face spend, Preview, or walking through first.

`lib/owner-surfaces/owner-state.ts` is a single owner-bound read that all three surfaces share, so
they cannot tell the member three different stories:

- **Workshop** (`/dashboard/blueprints`) — the member's own bench: each intake answer under its own
  label, unanswered ones called out as ranking cost; a named pressure hypothesis; the coverage gap
  derived from their signals; and next steps that include "Werkles does not act for you".
- **Proof** (`/dashboard/crucible`) — checks chosen from that member's own intake, ordered by
  leverage, each stating why it matters *for them* and what a pass would and would not change.
  A capital-seeking intake surfaces Identity + Funds high and Business entity medium. The ghost
  section was reframed from a sandbox gap dump into "what is unverified about the people you would
  be matched with".
- **Dues** (`/membership`) — a "where you actually stand" readout driven by `/api/owner/state`,
  listing what is genuinely unlocked for this session next to what dues explicitly do not change.

The red team now also asserts, per ghost: Workshop shows that owner's intake, Proof lists an owner
check, `/api/owner/state` sees the intake and keeps its no-guarantee language, a cookieless caller
gets neither the Workshop bench nor a claimed intake, and the previous ghost's session never sees
the current ghost's Workshop.

**40/40 PASS, 0 fail. Surface attack 8/8 PASS.**

### A shallow test caught in the act

The first version of the Proof assertion passed while a human walking to `/dashboard/crucible` was
being bounced to `/login` — the auth guard is client-side, so the server HTML contained the content
the script was grepping for. Same class of mistake as the original "40/40 PASS". Two fixes: the
guard now opens member surfaces when `NEXT_PUBLIC_GHOST_FLEET_UI=1` (Local/Preview only, with a
visible banner saying the session is not an account), and the assertion checks for that banner so a
login-bounce regression fails the run.

## Still not done — do not read this as finished

1. **No CBCC seat has reviewed this.** Ender and Bean packets are sitting in the outbox unanswered.
   The adversarial work above is Foreman-authored test code, not an outside review.
2. **Preview is still blocked.** Intake writes to the local filesystem; Vercel's is read-only.
   Preview needs the Supabase intake table, which is a schema gate.
3. **Faces are placeholders.** No Aeye portrait spend until the Operator phrase.
4. **Proof checks are described, not runnable.** Workshop, Proof, and Dues now read from real
   owner state, but starting an actual Identity or Funds check still runs through the existing
   Crucible provider path and is gated behind live-money phrases.
5. **Owner binding is a cookie, not an account.** Clearing cookies loses the readout.
6. **The repo is dirty** (hundreds of uncommitted/untracked files predating this work), so there is no
   clean commit to push even if a push were authorized.
