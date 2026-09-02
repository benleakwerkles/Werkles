# FOREMAN COLD START — next Cursor thread

**TO:** Next Lady Jessica / Foreman session on Betsy  
**FROM:** Prior Foreman thread (same Operator: Ben)  
**DATE:** 2026-08-04  
**PURPOSE:** Bootstrap without reteaching the project. Read this before editing, dispatching, or claiming site state.  
**EXECUTION CONTEXT:** `LOCAL_SALLY_WINDOWS` (machine: **Betsy**)

---

## 0. FIRST RULE — TWO TREES (do not get this wrong)

There are **two** Werkles folders. Confusing them loses work.

| Role | Path | Truth |
|------|------|--------|
| **LIVE tree** (edit here) | `C:\Users\Ben Leak\github\Werkles` | Active code, intakes, VPGM scripts, running server |
| **RETIRED clone** | `C:\Users\Ben Leak\Desktop\github\Werkles` | Cursor workspace often still points here. Stale. Do not treat as source of truth. |

- Petra + Skybro both ruled **two-tree resolution = Operator human gate**.
- If Cursor opens the Desktop clone, **move the agent root** to the live path before doing hands work, or you will write into a dead tree.
- Ben is Operator, not copy/paste mule. Cockpit files are authority: `foreman/HUMAN_GATES.md`, `LANES.md`, `BUDGET.md`, `NEXT_ACTION.md`, `AI_COUSINS_PROTOCOL.md`.

---

## 1. Who you are and how you work

- You are **Foreman (Lady Jessica / LJ)** for Werkles.com product + CBCC dispatch.
- **CBCC** = Care Bot Cousin Crew (canonical name; not "AI cousins" casually).
- Seats: **Petra** (ChatGPT), **Skybro** (Gemini), **Ender** (Claude), **Bean** (DeepSeek), **Computer** (Perplexity). Plus Image Sniper / others for face work.
- Ben built CBCC so Foreman **does not solo-build and call it done**. Red-team corrections before landing. Use VPGM to dispatch real packets, harvest replies, assimilate.
- **Do not open your own subagents for product work that belongs to CBCC seats** unless Ben asks. Do use explore/shell when needed for local facts.
- **LOCAL HANDS READBACK** required before editing / servers / git (see `foreman/EXECUTION_CONTEXT_RULES.md`).
- Shell allowlist on Betsy: prefer `git`, `npm`, `node`, `npx`, `vercel`, `gh`, `curl.exe` to localhost. **Never** `netstat` / `findstr` / `tasklist` / `Get-Process` (trips Auto-review). Port checks = `node fetch` or browser MCP.
- Never enter secrets. Never approve Human Gates for Ben.

---

## 2. VPGM model (how CBCC work is supposed to run)

### Canon (Swanson-authored)

- File: `foreman/VPGM_OPERATING_CANON.md`
- Header: `Source: Swanson, delivered to Foreman by the Operator 2026-08-03`
- Verify before obeying: `node scripts/foreman/vpgm-canon-hash.mjs verify`
- Core P-section: route proof → compose (`COMPOSED_NOT_SENT`) → native Send once → transcript echo → `POSTED_NOT_CUSTODY` → custody via receiver `RECEIVED` → `SUBMISSION_ID` idempotency → no secret handling / signed-out = Human Gate.

### Critical authorship lesson (do not repeat)

Ben asked for "correction code" to send Swanson for compare-and-beat. Foreman sent **V1** that restated Swanson's own canon as if it were LJ's design. Swanson correctly called it his code. **V1 withdrawn.**

- Withdrawn: `foreman/handoffs/outbox/TO_SWANSON_DISPATCH_CUSTODY_MECHANISM_V1.md`
- Correct packet (delta only): `TO_SWANSON_DISPATCH_CORRECTIONS_V2.md` (also on Desktop)
- Swanson replied with canon patch (accepted challenge/echo, truncation hard state, account-identity split, return-leg in scope). **Not promoted to Operator canon** — doctrine change needs Human Gate.
- LJ reply + source receipt: `TO_SWANSON_LJ_HARVESTER_SOURCE_RECEIPT.md` (also on Desktop)

### Local implementation (LJ) — largely **UNTRACKED**

These exist on Betsy disk under the live tree; most never committed:

| Script | Job |
|--------|-----|
| `scripts/foreman/crew-dispatch-send.mjs` | Route proof, native Send, ledger, post proof |
| `scripts/foreman/crew-reply-harvest.mjs` | Pull replies from provider transcripts → inbox |
| `foreman/crew-dispatch/crew-vpgm-command.mjs` | Issue mission paste blocks + custody challenge nonce |
| `foreman/crew-dispatch/DISPATCH_LEDGER.jsonl` | Idempotency ledger |
| `foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json` | Last issued mission |

**Known hang:** `node scripts/foreman/chrome-cdp-courier.mjs status` can hang for hours. Do **not** run it unbounded. Use short-timeout CDP `json/version` / seat queries, or kill hung shells immediately.

### Swanson corrections already applied in local code (not canon-promoted)

1. Challenge nonce ≥ 128 bits (`randomBytes(16)`); not a "secret"/password; echo → `CUSTODY_CHALLENGE_ECHOED__IDENTITY_PENDING` until identity/route/capability/dependency pass; then `CUSTODY_PROVED`.
2. Truncation: full normalized body equality; terminal `POSTED_PARTIAL_OR_MUTATED__DO_NOT_REPEAT` (do not revert to `COMPOSED_NOT_SENT`).
3. Signed-out only with positive sign-in evidence; else `ROUTE_UNPROVED_ACCOUNT_IDENTITY`.
4. Inbox dispatch guard scoped by cousin + mission lineage (not global freeze).

### Integration seam Swanson proposed

LJ adapter harvests browser transcript → Swanson custody compiler verifies attested source / HMAC where available → validator → Foreman assimilates. Browser seats have **no HMAC**; weaker class than Harvey Codex records — say so explicitly.

---

## 3. Product work this Foreman cycle (site)

### Mission framing

Ben wants a **functional walkthrough** (Intake → Workshop → Intros → Proof → Dues) against a **150-member Ghost Fleet**, red-teamed by CBCC, with Human Gate phrases for activation. Local/preview only — not production ghosts on werkles.com without phrases.

### Recommendation View (Intros) — major rebuild + CBCC red team

- Spec: Maker recommendation view (processed under inbox).
- Model: `lib/recommendation-view/model.ts`
- Page: `app/dashboard/intros/page.tsx`
- CSS tokens + 13px floor: `.recview` in `app/globals.css`
- Owner-bound via bellows owner cookie + intake storage.

**CBCC red team (Petra, Skybro, Ender harvested):** findings assimilated; Ender NO-GO on walkthrough as reviewed work; copy he wrote → he recused → **second seat still owed**.

**Corrections applied after red team** (self-tested; not second-seat signed):

- Band legend split: Strong/Medium/Slim evidence vs CountsAgainst (shape differs).
- De-name members when no doors shown (Ava contradiction).
- Verdict-first order; plain "Next move:" language; squeeze clause from intake.
- Type floor 13px; remove fabricated "rarest" claim; enabled action "Put your numbers in".
- Ghost handeye suite: 150/150 pass after coherence assertions; empty-suite now exits 2.
- Receipts: `foreman/receipts/CBCC_REDTEAM_FINDINGS_ASSIMILATED_20260803.md`, `CBCC_REDTEAM_CORRECTIONS_APPLIED_20260803.md`

**Walkthrough verdict:** still **NO-GO as reviewed work** until second seat reviews.

### Ghost fleet / owner surfaces

- Fleet: `data/ghost-fleet/members.json` (150)
- Matching: `lib/ghost-fleet/match.ts` (real ranking, not fake `% 3`)
- Workshop / Proof / Dues: owner-bound via `lib/owner-surfaces/owner-state.ts`
- Local UI without sign-in: `NEXT_PUBLIC_GHOST_FLEET_UI=1` in `.env.local`
- Handeye: `node scripts/foreman/ghost-fleet-handeye-attack.mjs http://127.0.0.1:3000 150`
- Intakes: only saved on **Submit** — no draft autosave. Packets under `data/squibb/concierge-intakes/`, index `data/squibb/concierge-intakes.jsonl` (local, largely untracked).

### NEXT_ACTION / activation

- Cockpit: `foreman/NEXT_ACTION.md`
- Next Operator phrase waiting historically: `APPROVE GHOST FLEET FACE BATCH 150`
- Ladder: `TO_OPERATOR_CBCC_GHOST_FLEET_ACTIVATION_LADDER_20260802.md`
- Live Stripe HG-3 approved; HG-4/HG-5 still gated.

---

## 4. Live runtime (as of handoff write)

| Service | State |
|---------|--------|
| Production `npm run start` | `http://127.0.0.1:3000` — was up (re-check with `node fetch`) |
| Chrome CDP crew profile | port **9335** — was up |
| Branch | `maker/site-g-20260703` @ `93b79d1` |
| Working tree | **DIRTY** — many product + foreman files uncommitted |

**Seat status last known:** Petra / Skybro / Ender signed in and used for red team. **Bean + Computer** `BLOCKED_RECEIVER_SIGNED_OUT` — packets STILL_OWED. Confirm with bounded check, not hung `status`.

---

## 5. Open obligations (do not invent completions)

### Human gates (STOP — Ben only)

1. Sign in DeepSeek (Bean) + Perplexity (Computer), then dispatch owed packets.
2. Two-tree resolution (which tree Cursor uses; retire Desktop clone or retarget workspace).
3. Commit/push of untracked VPGM + product work (Ben must ask).
4. Promote Swanson canon delta into Operator canon.
5. Ghost face batch / production phrases from ladder — only on exact phrases.

### Technical / process still owed

1. Second-seat review of Recommendation View corrections (Ender recused).
2. Bean trust rulings (4) including whether named unverified members may show.
3. `BUDGET.md` missing CBCC dispatch lane (Tier 1 flag, $0 spend, not blocking).
4. Nonce not yet fully bound to PACKET_ID / SUBMISSION_ID / Role@Machine / work object (flagged to Swanson).
5. Return-leg state names not fully aligned to Swanson's four-state chain.
6. **No unit/integration tests for dispatch/harvest** — handeye covers product surface only.
7. Intake draft autosave gap (product defect Ben hit).

### Do not

- Re-send Swanson his own canon as "your design."
- Claim POSTED = custody.
- Claim walkthrough GO without second-seat / Bean where required.
- Poll/spam providers; hang forever on courier status.
- Push / deploy / spend faces / open prod intake without phrase.

---

## 6. How to resume VPGM in the new thread (short)

1. Confirm live tree path + LOCAL HANDS READBACK.
2. `node scripts/foreman/vpgm-canon-hash.mjs verify`
3. Read HUMAN_GATES / LANES / BUDGET / NEXT_ACTION.
4. Bounded seat check (timeout); do not run unbounded `chrome-cdp-courier.mjs status`.
5. `crew-response-intake.mjs status` — clear/consume unread before new issue if lineage blocks.
6. Issue mission → `crew-dispatch-send.mjs dispatch` → harvest → validate → assimilate → FOREMAN STATUS block per canon.
7. If signed out → `BLOCKED_RECEIVER_SIGNED_OUT` / Human Gate; preserve STILL_OWED; no substitution.

---

## 7. Key paths cheat sheet

```
LIVE REPO
  C:\Users\Ben Leak\github\Werkles

CANON / COCKPIT
  foreman/VPGM_OPERATING_CANON.md
  foreman/HUMAN_GATES.md
  foreman/LANES.md
  foreman/BUDGET.md
  foreman/NEXT_ACTION.md
  foreman/AI_COUSINS_PROTOCOL.md

DISPATCH
  scripts/foreman/crew-dispatch-send.mjs
  scripts/foreman/crew-reply-harvest.mjs
  foreman/crew-dispatch/crew-vpgm-command.mjs
  foreman/crew-dispatch/DISPATCH_LEDGER.jsonl

PRODUCT
  lib/recommendation-view/model.ts
  app/dashboard/intros/page.tsx
  lib/ghost-fleet/
  lib/owner-surfaces/owner-state.ts
  data/ghost-fleet/members.json

RECEIPTS / SWANSON
  foreman/receipts/CBCC_REDTEAM_*20260803.md
  foreman/handoffs/outbox/TO_SWANSON_DISPATCH_CORRECTIONS_V2.md
  foreman/handoffs/outbox/TO_SWANSON_LJ_HARVESTER_SOURCE_RECEIPT.md
  foreman/handoffs/outbox/TO_NEXT_THREAD_FOREMAN_COLD_START_20260804.md  (this file)

PRIOR THREAD TRANSCRIPT (detail)
  C:\Users\Ben Leak\.cursor\projects\c-Users-Ben-Leak-Desktop-github-Werkles\agent-transcripts\85a87d60-b449-4f8d-8c88-5819c4bbefb1\
```

---

## 8. One-paragraph status for Ben

Foreman installed Swanson's VPGM canon, built real dispatch+harvest with custody challenges, red-teamed Recommendation View with CBCC (3 seats), applied corrections on the live tree, and is mid-cycle on Swanson canon-delta integration. Walkthrough is improved but not second-seat cleared. Bean/Computer still owed. Two trees still unresolved. Most VPGM machinery is uncommitted on Betsy only. Do not restart from zero — continue from this packet and the live tree.

---

**Paste instruction for Ben:** Open a new Agent chat → attach or paste this file → say "You are Foreman. Live tree is `C:\Users\Ben Leak\github\Werkles`. Continue from this cold start."
