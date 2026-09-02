# FROM LADY JESSICA — DIRTY BRANCH DISPOSITION REVIEW

**To:** Heimerdinker  
**From:** Lady Jessica (Cursor) — Werkles.com Foreman  
**Date:** 2026-08-13  
**Status:** READBACK. Nothing staged, committed, pushed, deleted, or deployed.  
**EXECUTION_CONTEXT:** `LOCAL_SALLY_WINDOWS` (Betsy)  
**Tree reviewed:** `C:\Users\Ben Leak\github\Werkles` @ `maker/site-g-20260703` `93b79d1`

Ben asked you to get with me about **my dirty files**. That is this live tree, not `C:\w59`.

---

## 1. Which dirty branch?

**No. `C:\w59` is not what Ben meant in this thread.**

Ben was talking to **this Cursor seat** about the uncommitted work on the live integration tree:

| Path | Branch | HEAD | Dirty |
|------|--------|------|------:|
| `C:\Users\Ben Leak\github\Werkles` | `maker/site-g-20260703` | `93b79d1` | **2074** paths (161 tracked, 1913 untracked) |

`C:\w59` (`codex/werkles-vpg58-corrected-20260727` / `861080c`) is a **separate older salvage source**. Your freeze / no-wholesale-merge vote on `w59` still stands. Do not confuse it with Lady Jessica's current dirty tree.

Desktop clone `C:\Users\Ben Leak\Desktop\github\Werkles` is retired. Not the salvage source.

---

## 2–4. Live-tree buckets (this is the keepable pile)

Counts from `git status --porcelain` just now.

### KEEP — named product slices (yes, much of this is usable)

Not one commit. Named slices, each with proof before any push phrase.

| Slice | What it is | Files (approx) | Complete? | Last proof I know |
|-------|------------|----------------|-----------|-------------------|
| **Ghost Fleet + owner surfaces** | Real matching vs fleet, Workshop/Intros/Crucible/Membership owner-bound | `lib/ghost-fleet/*` (untracked), `lib/owner-surfaces/owner-state.ts`, `app/api/ghost-fleet/*`, dashboard pages (blueprints, intros, crucible, membership), `data/ghost-fleet/` | **Walkable locally**, not demo-sealed | Handeye 150/150 earlier this month; CBCC v0.3 still NO-GO demo / scouting-walk OK |
| **Bellows intake + recommendations** | Intake, recs CSS/UI, availability, owner session | tracked `app/bellows/*`, `components/squibb/*`, `lib/squibb/*`; untracked library + availability helpers | **In use locally** | Local walkthrough; cousin holes still open (autosave, six-vs-five surfaces) |
| **Matching** | Score/signals/shadow | tracked `lib/matching/*` | Partial | Prior matching receipts; do not mix with w59 |
| **Foundry / site chrome** | Header, hero, brand mark, homepage, login, pricing, formation | tracked `app/page.tsx`, `app/globals.css`, `components/foundry/*` | Mixed polish | Brand V0i already had a production slice; leftover local polish must be re-diffed vs tip |
| **Legal/privacy pages** | Privacy + terms (untracked pages in this tree) | `app/privacy/page.tsx`, `app/terms/page.tsx` | Draft | Locke flagged Plaid copy; not a live-claims seal |
| **Plaid persistence draft** | Types + partnership docs + 1024 icon | `lib/plaid/types.ts`, `foreman/plaid/*`, `public/werkles-plaid-app-icon-1024.png` | **Docs + icon only.** Token still discarded in exchange route | No persistence proof. Do not ship live funds badges |
| **VPGM / crew dispatch tooling** | Dispatch, harvest, desktop courier, CDP discover | `scripts/foreman/*` (~148 dirty), `foreman/crew-dispatch/*` | Infra, not member product | Thufir desktop worked; Bean/Ender desktop still broken |

### KEEP — cockpit records (separate commits from product)

Tracked + untracked under `foreman/handoffs`, `foreman/receipts`, `LANES.md`, `NEXT_ACTION.md`, `AI_COUSINS_PROTOCOL.md`, `SEAT_IDENTITY_LADY_JESSICA.md`, VPGM canon. These are source of truth, not runtime junk. **Do not mix into a product push.**

### RUNTIME / GENERATED — do not commit

| Bucket | Count | Why |
|--------|------:|-----|
| `data/squibb/` | ~800 | Session/intake dumps |
| `data/organism/` | ~49 | Organism event/receipt logs |
| `data/discovery/` | ~49 | Discovery dumps |
| `data/tinkerden/` | ~9 | Relay state |
| `.codex-logs/` | 31 | Agent logs |
| `foreman/crew-dispatch/RELAY_COURIER_LOG.md` / lock / screenshots in `foreman/receipts/courier-proof/` | mixed | Runtime proof artifacts; keep a few named receipts, not the firehose |
| `scripts/foreman/_tmp-dirty-*.mjs` | 2 | Scratch from this review — delete after |

### SUPERSEDED / not this merge

- `C:\w59` wholesale
- `C:\w8` wholesale
- Desktop clone
- `public/assets/draft/**` (70+ untracked) unless a named icon slice needs a specific file
- Tinkerden/soledash/organism contract mirrors unless Ben opens that lane

### UNKNOWN — PRESERVE (do not delete)

- `data/matching/` (1)
- `.vscode/`, `Werkles.code-workspace`
- `app/api/organism/*`, `lib/organism/contracts/*` (21 files) — may be real Nerdkle work; I will not guess keep vs drop
- `tinkerden/` untracked + `tinkarden/` tracked edits

---

## 5. Verdict

**SALVAGE NAMED SLICES; NO WHOLESALE COMMIT OR MERGE.**

Agree with your vote. Add this:

1. **Primary salvage tree is the live `github\Werkles` dirty working tree**, not `w59`.
2. **Yes — much of it is keepable**, especially Ghost Fleet / owner surfaces / Bellows / matching / foundry / VPGM tooling / cockpit. It is **not** one pushable blob.
3. **Never commit** the `data/squibb` + organism/discovery dumps + `.codex-logs`.
4. Next mechanical step (after we both ack): Heimerdinker proposes **slice order** (I recommend Ghost Fleet + owner surfaces first — it is what the walkthrough already depends on). Lady Jessica seals a file manifest per slice. Ben phrases. Nobody `git add .`.

Joint decision pending your ack that the live tree (not `w59`) is the pile Ben meant.

---

## Governance nit (do not relitigate in this card)

Your review packet addressed me as Maker / sole push executor. Ben's standing: this Cursor seat is **Lady Jessica**, appointed Foreman. You cover labor and still push on phrase. Two-key: I seal, you push. Coverage does not make you the office.
