# TO HEIMERDINKER — ROUNDED PUSH PACKET (2026-07-25)

Packet: `TO_HEIMERDINKER_ROUNDED_PUSH_PACKET_20260725`  
From: LadyJessica@Betsy  
Branch: `maker/site-g-20260703` @ `674f3db` (= origin tip)  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Status: **READY — all proofs green.** Match Ben's phrase to a slice below; push only that slice.

## Pre-flight (Lady Jessica, this cycle)

| Proof | Result |
|-------|--------|
| `node scripts/foreman/test-matching-vpg8-surface.mjs` | **PASS** (9/9) |
| `node scripts/foreman/test-bellows-intake-closed-gate.mjs` | **PASS** (8/8 durable pre/post-commit checks) |
| `npx tsc --noEmit` | **PASS** (exit 0 — fixed invalid `approved_ben_hands` status in `lib/product-human-gates.ts`) |
| Local + prod nested Bellows / crucible | **200** |

## Slice A — Intake closed-gate (harden or open)

Phrase (either):
- `APPROVE SHIP BELLOWS INTAKE CLOSED-GATE TO WERKLES.COM WITHOUT OPENING` (closed)
- `APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM` (open — Ben also sets Vercel env true)

```text
lib/squibb/concierge-intake-availability.ts        (?? new)
components/squibb/concierge-intake-form.tsx        (M)
app/api/bellows/intake/route.ts                    (M)
.env.example                                       (M)
scripts/foreman/test-bellows-intake-closed-gate.mjs (?? new)
```

Post-push proof: closed-gate script PASS on pushed tip. Deploy only if the phrase includes production; closed variant smokes POST fixture → **503**.

**2026-07-25 noon correction:** the proof no longer asserts that `HEAD` lacks the availability module. That assertion would have made the required post-commit run fail after a successful Slice A commit. The remaining eight checks are valid both before and after commit.

## Slice B — VPG10 UI declutter

Phrase: `PUSH VPG10 UI UX SCOPE ONLY ON maker/site-g-20260703`

```text
components/squibb/recommendation-surface.tsx       (M)
components/squibb/reasoning-panel.tsx              (M)
components/squibb/evidence-section.tsx             (M)
components/squibb/source-document-panel.tsx        (?? new)
app/bellows/recommendations/squibb-recommendations.css (M)
scripts/foreman/test-matching-vpg8-surface.mjs     (M)
```

Post-push proof: VPG8 script PASS on pushed tip. **No deploy** without a separate deploy phrase.

## Slice C — Cockpit docs (safe with either slice, or standalone docs push)

Werkles-lane foreman docs from this arc (approvals, gates, receipts, handoffs):

```text
foreman/NEXT_ACTION.md                             (M)
foreman/gates/APPROVAL_LOG.md                      (M)
foreman/VPG_SHORTHAND.md                           (?? new)
foreman/reviews/GATE-nested-bellows-prod-deploy-20260724.md        (?? new)
foreman/reviews/GATE-ship-bellows-intake-closed-gate-20260725.md   (?? new)
foreman/reviews/GATE-open-bellows-intake-submission-20260720.md    (M or ??)
foreman/reviews/GATE-live-crucible-hg3-hg5-20260721.md             (M or ??)
foreman/receipts/WERKLES_NESTED_BELLOWS_SOFT_LIVE_DEPLOY_20260724.md
foreman/receipts/WERKLES_HG3_LIVE_STRIPE_PRODUCT_CREATE_APPROVED_20260723.md
foreman/receipts/WERKLES_LADY_JESSICA_PG_2026072*.md (Werkles P,G receipts)
foreman/receipts/WERKLES_LADY_JESSICA_DOUBLE_P_TRIPLE_G_202607*.md
foreman/handoffs/outbox/TO_HEIMERDINKER_EXECUTE_AFTER_OPERATOR_PHRASE_20260720.md
foreman/handoffs/outbox/TO_HEIMERDINKER_INTAKE_BOUNDARY_SHIP_INVENTORY_20260725.md
foreman/handoffs/outbox/TO_HEIMERDINKER_VPG10_UI_UX_PUSH_READY_20260719.md (M)
foreman/handoffs/outbox/TO_OPERATOR_WERKLES_COM_WAITING_PHRASES_CANONICAL.md (?? new)
foreman/handoffs/outbox/TO_OPERATOR_HG3_LIVE_STRIPE_PRODUCT_CREATE_HANDS_20260723.md
foreman/handoffs/outbox/TO_OPERATOR_HG4_LIVE_SECRET_ENTRY_PREP_20260724.md
foreman/handoffs/outbox/TO_OPERATOR_SOFT_LIVE_NESTED_BELLOWS_20260724.md
foreman/handoffs/outbox/TO_OPERATOR_SOFT_LIVE_INTAKE_CLOSE_GAP_20260725.md
lib/product-human-gates.ts                         (M — HG-3 status note + type fix)
```

## DO NOT include (dirty but out of scope)

```text
app/api/beta/route.ts, app/api/nerdkle/*, app/api/soledash/*, app/api/tinkerden/*
app/bellows/intake/page.tsx + concierge-intake.css (unless Ben adds intake-UI scope)
components/foundry/*, lib/matching/* (unreviewed)
.gitignore, .vscode/, app/api/operator/
foreman non-Werkles lanes (RustDesk, PowerToys, soledash state JSONs, source-truth, Medullina/Betsy machine docs)
```

## Rules

- Commit message per slice; no merge to `main`; no deploy/env/secrets unless the phrase says so.
- Re-run both proof scripts after commit, before push; abort on FAIL.
- Before staging: `node scripts/foreman/verify-heimerdinker-push-hashes.mjs` → must PASS against `TO_HEIMERDINKER_PUSH_FILE_HASHES_20260725.sha256`. Stop on drift unless the change is understood and re-proved.
- Receipt each push: pushed tip SHA + proof output.

`READY FOR P` — still waiting on Ben's phrase match (no execution as of 2026-07-25 midday)
