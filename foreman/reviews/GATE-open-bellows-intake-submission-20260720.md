# Tier 1 Gate — Open public Bellows intake submission

**Status:** `AWAITING HUMAN GATE`  
**Prepared:** `2026-07-20`  
**Prepared by:** Lady Jessica (Maker@Betsy)  
**Trigger:** Operator filled production intake answers and hit closed submit banner

## Why it is closed on werkles.com

**Update 2026-07-24:** Soft-live nested deploy (`674f3db`) restored `/bellows/intake` **pages**, but that tip does **not** include `lib/squibb/concierge-intake-availability.ts` or the API 503 close path. Closed behavior on tip is mostly empty-form submit-disabled UX.

The **intended** production close path (local dirty tree, not yet shipped):

- `BELLOWS_INTAKE_SUBMISSION_OPEN = false` (prod default via availability module)
- UI closed message when module is live
- API: POST `/api/bellows/intake` returns **503** while closed

Intent: no public submissions until durable **owner-scoped** custody exists (auth → member_id). File-backed / global intake storage alone was judged insufficient for public personal answers.

Opening production still requires the phrase below **and** shipping the local availability + form + API gate files.

## What Ben wants now

Submit the answers already typed on production.

## Immediate non-gate rescue (no prod flip)

Operator confirmed answers are **already copied**.

1. Open localhost: `http://127.0.0.1:3000/bellows/intake`
2. Paste and click **Submit intake**
3. Answers land in Betsy file custody under `data/squibb/concierge-intakes/` — not production Supabase member custody

Localhost Submit proof (2026-07-20 late G): GET **200**, Submit marker present, closed banner absent.

## Decision — open production submit?

```text
APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM
```

If approved, Heimerdinker / Maker executes:

1. Ensure `lib/squibb/concierge-intake-availability.ts` is on the ship branch (local/dev open by default; prod closed unless env set)
2. Set Vercel Production env: `NEXT_PUBLIC_BELLOWS_INTAKE_SUBMISSION_OPEN=true` and `BELLOWS_INTAKE_SUBMISSION_OPEN=true`
3. Scoped push (availability + form + API gate only) + Production redeploy
4. Smoke: GET `/bellows/intake` shows **Submit intake**; POST returns success (not 503)

Localhost remains open without that phrase (`NODE_ENV !== production`).

## Residual risk if opened before owner-binding

- Submissions may be global/file or otherwise not member-scoped
- Public recommendations must remain example-only / fail-closed for personal delivery (VPG8)
- Export/deletion story may still be incomplete

Alternate safer phrase (Preview only):

```text
APPROVE OPEN BELLOWS INTAKE SUBMISSION ON PREVIEW ONLY
```

## Forbidden without this phrase

- Flipping production intake open
- Deploying closed→open flag
- Absorbing unrelated dirty tree into the open-intake ship

## Immediate Operator action (answers)

```text
COPY ANSWERS NOW — then paste to http://127.0.0.1:3000/bellows/intake
```
