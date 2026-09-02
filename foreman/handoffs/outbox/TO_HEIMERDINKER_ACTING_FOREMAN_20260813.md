# TO HEIMERDINKER — Acting Foremanship (temporary)

**From:** Lady Jessica (Cursor) — Werkles.com Foreman  
**Operator:** Ben, 2026-08-13 ~16:10 ET, Betsy  
**To:** Heimerdinker / Dink  
**Status:** Operator instruction. Cover Foreman *labor*. Do not take the office.

Ben asked you to take Foremanship **for a bit** because Cursor/Grok burned
training on this stretch. Same sitting he corrected: **"Cursor here is Lady
Jessica"** — and that is **a lot more than** a name. Lady Jessica stays
appointed Werkles.com Foreman. You cover the work in Codex so this Cursor
thread is not the orchestration mule.

---

## What you are now

**Coverage, not succession.** Run cockpit follow-through, CBCC dispatch,
Plaid product lane (not Plaid dashboard login), walkthrough orchestration
from Codex. Seal only slices you are covering; do not recast this as
"Lady Jessica is Maker / local hands / not Foreman."

Lane: `foreman/LANES.md` → "Lane: Werkles.com Foreman — Lady Jessica"  
Cockpit: `foreman/NEXT_ACTION.md`

---

## Two-key warning (do not skip)

You already hold the **push seat**. Covering Foreman labor does **not**
collapse Lady Jessica's seal. Standing law: she seals, you push on Ben's
phrase. If you must seal a coverage slice yourself, do not also push it
without Petra GO/NO-GO or Ben.

**Standing rule while you are acting Foreman:**

- You may **seal** and **coordinate**.
- You still **do not** push/deploy without Ben's exact phrase.
- You **do not** seal and push the same slice in one motion without a second pair of eyes (Petra GO/NO-GO, or Ben). Record every executed push in `foreman/gates/APPROVAL_LOG.md`.
- Single-writer on `vercel --prod` for werkles1 still applies — one writer, still Ben-authorized.

---

## Live tree (do not get this wrong)

| Role | Path |
|------|------|
| **LIVE** | `C:\Users\Ben Leak\github\Werkles` @ `maker/site-g-20260703` `93b79d1` |
| **RETIRED clone** | `C:\Users\Ben Leak\Desktop\github\Werkles` — Cursor often still points here. Stale. |

Working tree is **dirty and large**. Do not treat Desktop as truth. Two-tree resolution is still an Operator gate (Petra + Skybro).

---

## This session (2026-08-13) — Plaid paperwork, not product go-live

Ben is filling Plaid's production application. He is **closer on Plaid's form than on Werkles funds proof.**

### Products to request

- **Balance** — real-time depository balances → threshold receipt
- **Assets** — broader snapshot → threshold receipt
- **Do not** request Auth, Transfer, Signal, Income, Identity, Plaid Check, Transactions, Investments Move, etc.

There is **no separate "Link" product** on Plaid's picker. "Link" is Plaid jargon for the bank-connect window. Werkles already opens it via `lib/crucible-providers.ts` + `components/crucible/plaid-link-launcher.ts`. Do not tell Ben to select Link.

### Copy already given to Ben (reuse, do not invent new)

- Overall use case: optional member-initiated **liquidity threshold proof**; derived receipt to one opted-in counterparty; not lending, not payments.
- Assets use case: aggregated snapshot → threshold math → receipt only.
- Balance use case: current balances → same receipt pattern.
- Auth: **out of scope**. If the form forced it, uncheck or tell Plaid Auth is not used.
- Privacy blurb: farm sensitive work to named third parties; keep derived results.

### Icon

Real W mark (from `https://werkles.com/assets/werkles-w-mark-transparent.png`), 1024×1024 PNG, transparent:

- Desktop: `C:\Users\Ben Leak\Desktop\Werkles-Plaid-App-Icon-1024.png`
- Repo: `foreman/plaid/werkles-plaid-app-icon-1024.png`
- Also: `public/werkles-plaid-app-icon-1024.png`

First AI-generated W was **wrong**. Do not regenerate. Use the files above.

### Product truth (code)

Sandbox Link + exchange exists. **`access_token` is discarded.** Connect currently marks `sandbox_verified` **without threshold math**. No receipts, webhooks, or `plaid_items` table applied. Schema draft: `foreman/plaid/PLAID_SCHEMA_DRAFT_V0.sql`. Gates not fired:

- `APPROVE PLAID PERSISTENCE SCHEMA`
- `APPROVE PLAID LIVE LIQUIDITY PROOF`

**Do not flip `PLAID_ENV=production` or live funds badges.** Plaid app progress ≠ Werkles go-live.

Maker slice when you are ready (Foreman issues; Maker builds): persist Item, Balance and/or Assets pull, compute threshold, write receipt, mule smoke, then Development-env real-bank test (Sophia's ~10 free live Items). Cousin red-team before any live badge.

Identity stays **Stripe Identity**. Plaid Identity/Income are not occupation proof.

---

## Prior Foreman work still open (do not drop)

1. **Ghost Fleet walkthrough** — `foreman/NEXT_ACTION.md`. Phrase still: `APPROVE GHOST FLEET FACE BATCH 150`. Local path: intake → recs → Workshop → Intros → Crucible → Membership. `NEXT_PUBLIC_GHOST_FLEET_UI=1`.
2. **CBCC v0.3 walkthrough holes** — assimilated; Maker UX packet `TO_MAKER_WALKTHROUGH_UX_HOLES_20260805.md`; Bean still owed if DeepSeek crew vs Operator Chrome mismatch remains.
3. **Ender desktop CDP** — still broken; packet `TO_HEIMERDINKER_ENDER_DESKTOP_CDP_REPAIR_20260804.md`.
4. **HG-4 / HG-5** Stripe live money — unchanged, Operator phrases.
5. **Bean / DeepSeek** — Operator signed-in Chrome ≠ crew CDP `:9335` isolated profile. Dispatch must attach to the Chrome that has the session.

Cold start if you need more: `foreman/handoffs/outbox/TO_NEXT_THREAD_FOREMAN_COLD_START_20260804.md` — Lady Jessica bootstrap; you cover the labor, you do not replace the office.

---

## How you start

1. LOCAL HANDS READBACK on Betsy, live tree.
2. Read `HUMAN_GATES.md`, `LANES.md`, `BUDGET.md`, `NEXT_ACTION.md`, `AI_COUSINS_PROTOCOL.md`.
3. Do **not** make Ben paste this packet. Open it in your Codex thread yourself.
4. First coverage move is yours: walkthrough vs Plaid persistence vs Ender CDP. Do not solo-patch product from cousin findings. Do not sign as Lady Jessica.

---

## Return

`foreman/handoffs/inbox/FROM_HEIMERDINKER_ACTING_FOREMAN_ACK_20260813.md`

One line is enough: `RECEIVED — covering Foreman labor. First move: <X>. Lady Jessica remains Foreman.`
