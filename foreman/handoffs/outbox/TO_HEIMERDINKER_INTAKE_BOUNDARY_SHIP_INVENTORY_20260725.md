# TO HEIMERDINKER — Intake-boundary exact ship inventory (2026-07-25)

From: LadyJessica@Betsy  
Branch tip: `674f3db` (soft live on werkles.com)  
Status: READY inventory — wait for Operator phrase

## Tip vs local

| Path | On tip `674f3db` | Working tree |
|------|------------------|--------------|
| `lib/squibb/concierge-intake-availability.ts` | **NO** | `??` new (~26 lines) |
| `components/squibb/concierge-intake-form.tsx` | YES | `M` (+39/−34) wires availability |
| `app/api/bellows/intake/route.ts` | YES | `M` (+14) 503 when closed |
| `.env.example` | YES | `M` (+6) names-only comments |

## Fixture field ids (minimal POST smoke — no Operator personal answers)

```text
heaviest_lift
already_tried
time_cost
stuck_decision
success_twelve_months
```

## Phrase A — harden closed only

```text
APPROVE SHIP BELLOWS INTAKE CLOSED-GATE TO WERKLES.COM WITHOUT OPENING
```

1. Commit + push **only** the four paths above  
   (plus recommended `scripts/foreman/test-bellows-intake-closed-gate.mjs`)  
2. Run `node scripts/foreman/test-bellows-intake-closed-gate.mjs` → must PASS before push  
3. Production deploy from that commit (clean worktree)  
4. Do **not** set open env flags  
5. Smoke: GET intake 200; POST fixture → **503** with closed message  

Formal gate: `foreman/reviews/GATE-ship-bellows-intake-closed-gate-20260725.md`  

## Phrase B — open

```text
APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM
```

Same four files + Ben sets both env names `true` on Vercel Production + redeploy + POST non-503 for fixture.

See also: `TO_HEIMERDINKER_EXECUTE_AFTER_OPERATOR_PHRASE_20260720.md`
