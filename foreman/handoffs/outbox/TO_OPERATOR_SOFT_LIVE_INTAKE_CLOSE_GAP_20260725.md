# TO_OPERATOR — Soft-live intake close-gap (optional harden before open)

From: LadyJessica@Betsy  
Date: 2026-07-25  
After: Double P / Triple G  

## Situation

Soft live put nested Bellows **pages** on werkles.com (`674f3db`).  
That tip does **not** include the local closed-submission module. Prod submit “disabled” is mostly empty-form UX, not the API 503 close path.

Local (uncommitted) already has the real close path:
- `lib/squibb/concierge-intake-availability.ts` (**new**)
- wired form + API (`503` when closed)

## Two separate phrases (do not conflate)

### A — Harden only (recommended before public open)

Ship the close module to prod **with flags left closed** (prod default closed; no open env).

Suggested phrase:

```text
APPROVE SHIP BELLOWS INTAKE CLOSED-GATE TO WERKLES.COM WITHOUT OPENING
```

Effect: real 503/close banner on prod; submit stays closed; nested routes stay.

### B — Open public submit (after A, or include A in same ship)

```text
APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM
```

Effect: scoped ship of same files + Vercel env both `true` + redeploy + smoke.

## Exact ship scope (either phrase)

```text
lib/squibb/concierge-intake-availability.ts
components/squibb/concierge-intake-form.tsx
app/api/bellows/intake/route.ts
.env.example
scripts/foreman/test-bellows-intake-closed-gate.mjs
```

Proof before ship: `node scripts/foreman/test-bellows-intake-closed-gate.mjs` → PASS  
Formal harden gate: `foreman/reviews/GATE-ship-bellows-intake-closed-gate-20260725.md`

Do not absorb the rest of the dirty tree.

## Money path (unchanged)

HG-3 still your Stripe hands → then `APPROVE SECRET ENTRY` → `APPROVE PAID CHECKOUT GO-LIVE`

Local submit (open): `http://127.0.0.1:3000/bellows/intake`
