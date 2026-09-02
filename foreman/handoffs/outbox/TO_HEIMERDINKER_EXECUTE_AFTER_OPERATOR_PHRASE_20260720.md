# TO HEIMERDINKER — Execute after Operator phrase (intake open OR VPG10 push)

Packet: `TO_HEIMERDINKER_EXECUTE_AFTER_OPERATOR_PHRASE_20260720`  
Refresh: 2026-07-24 (LadyJessica Double P / Triple G)  
From: LadyJessica@Betsy  
To: Heimerdinker / Dink@Betsy  
Branch: `maker/site-g-20260703`  
Repo: `C:\Users\Ben Leak\github\Werkles`

Do **nothing** until Ben’s exact phrase matches one block below. `P, G.` / Double P / Triple G alone is not enough.

---

## Soft-live fact (2026-07-24)

Production soft-live deploy (`674f3db` → werkles.com) restored nested routes.

That tip does **NOT** include:
- `lib/squibb/concierge-intake-availability.ts`
- API/form closed-submission gate (503 / `BELLOWS_INTAKE_*`)

Those exist only in the **dirty local tree**. Env flip alone on current tip will not install the availability module — you must ship the local intake-boundary files first (or with the open phrase).

---

## If phrase = open production intake

```text
APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM
```

1. Confirm ship commit contains:
   - `lib/squibb/concierge-intake-availability.ts` (**new — not on tip yet**)
   - `components/squibb/concierge-intake-form.tsx` (dirty vs tip)
   - `app/api/bellows/intake/route.ts` (dirty vs tip — 503 close when flag false)
   - `.env.example` (names only)
2. Vercel Production env (Ben enters; you do not print values):
   - `NEXT_PUBLIC_BELLOWS_INTAKE_SUBMISSION_OPEN=true`
   - `BELLOWS_INTAKE_SUBMISSION_OPEN=true`
3. Scoped push of intake-boundary files only (no VPG10 UI dump, no unrelated api junk).
4. Production redeploy + smoke:
   - GET `/bellows/intake` — Submit enabled when open
   - POST minimal fixture → non-503 when open; **503** if flag off
5. Do not absorb the rest of the dirty tree.

Gate: `foreman/reviews/GATE-open-bellows-intake-submission-20260720.md`

---

## If phrase = VPG10 UI push

```text
PUSH VPG10 UI UX SCOPE ONLY ON maker/site-g-20260703
```

Execute exactly: `foreman/handoffs/outbox/TO_HEIMERDINKER_VPG10_UI_UX_PUSH_READY_20260719.md`  
Re-run `node scripts/foreman/test-matching-vpg8-surface.mjs` → must PASS.  
No production deploy unless a separate deploy phrase exists.

---

## Pre-flight (Lady Jessica 2026-07-24)

| Check | Result |
|-------|--------|
| Soft live nested routes | **200** on werkles.com |
| Tip has availability module | **NO** |
| Local availability + 503 gate | Present (uncommitted) |
| VPG8 | **PASS** |

`READY FOR P` — blocked only on Operator phrase match
