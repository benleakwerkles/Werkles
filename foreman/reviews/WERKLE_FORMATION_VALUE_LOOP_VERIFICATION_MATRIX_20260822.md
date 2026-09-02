# Werkle Formation Value Loop — Verification Matrix

Checkpoint: `WERKLE_FORMATION_VALUE_LOOP v0.1`
Context: `LOCAL_SALLY_WINDOWS` on Betsy

## Shared source truth

| Stage | Current behavior | Custody | Honest member claim | Proof |
|---|---|---|---|---|
| Match Deck selection | A selected Ghost Member opens Formation with a candidate id | In-memory UI selection plus validated synthetic fleet id | Practice candidate selected; no person contacted | `match-deck-shared-werkle-preview-smoke.mjs` and browser smoke |
| Practice conversation | Questions and generated answers are synthetic rehearsal | Component memory; preparation context may be browser-local | Practice only; no introduction or message | Ghost interaction contracts |
| Partner perspective | Member records self-answer and a private prediction; generated partner answer remains labeled practice data | `sessionStorage`, scoped to formation id; clears with tab | Private guess, never the partner's answer and never shared | Formation contract smoke |
| Formation decisions | Each practice actor chooses source wording, joint wording, private, or unresolved | `localStorage`, scoped to formation storage key | Saved only in this browser/device; source Workshops unchanged | Formation contract + browser legibility smoke |
| Mutual wording | Exact-text approval from both practice actors is required | Formation draft revision and accepted-revision records | Only the exact mutually accepted revision crosses the line | Formation contract smoke |
| Rewrite | Any edit creates a revision and resets both approvals | Local formation event ledger | Prior approval does not silently follow changed wording | Formation contract smoke |
| Objection/private | Disputed, parked, and private material stays outside shared company language | Local formation ledger/history | Disagreement remains visible; silence is not consent | Formation contract smoke |
| Personal Bellows handoff | Partnership Alignment produces a revisitable preparation memo | `localStorage` on this browser/device | Saved locally, not account-synced or sent | Memo source + browser save/reload/clear smokes |

## Not complete and not to be implied

- No real second member controls the generated partner side.
- No invitation, notification, message, membership change, or company record is created.
- No account-backed, cross-device, or server-side Formation custody exists.
- No legal entity, ownership agreement, financing decision, provider check, or
  adviser handoff is executed.
- No behavior from this exercise may silently alter matching rank or public
  member data.

## Review rotation

1. Ender attacks whether a human understands and feels safe in the sequence.
2. Bean attacks consent, prediction, privacy, ranking, and persistence claims.
3. Skybro attacks whether the resulting artifact is worth revisiting or paying for.
4. Computer converts accepted invariants into source-bound executable checks.
5. Petra arbitrates the accepted vertical slice.
6. Doozer and Lady Jessica build only from that combined review.
7. Ender, Bean, and Computer re-walk/re-attack the exact candidate.
8. Heimerdinker integrates and proves; Petra seals.

## Current local proof

- `node scripts/foreman/match-deck-shared-werkle-preview-smoke.mjs` — PASS
- `node scripts/foreman/match-deck-shared-werkle-preview-browser-smoke.mjs` — PASS
- `npx tsx scripts/foreman/werkle-formation-contract-smoke.ts` — PASS
- `node scripts/foreman/werkle-formation-legibility-browser-smoke.mjs` — PASS
- `node scripts/foreman/partnership-alignment-memo-smoke.mjs` — PASS
- `node scripts/foreman/partnership-alignment-memo-browser-smoke.mjs` — PASS

Passing local proof does not substitute for the terminal cousin receipts above.
