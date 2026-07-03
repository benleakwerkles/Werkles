# PROPOSAL_ENGINE_v1

Status: **Dink seed catalog** — SoleDash Decision Surface v2  
Until Dink replaces this file, SoleDash loads proposals from here.

## How SoleDash uses this file

1. Parse each `## Proposal:` block below
2. Surface as **decision cards** (what / why / impact / risk / time)
3. Transport (owner, cousin, paths) lives behind **MORE INFO**
4. YEA → dispatch · NAY → drop · DEFER → defer · MORE INFO → expand transport

---

## Proposal: Response Capture Automation

- **Summary:** Stop pasting cousin replies — machine ingests responses and validates receipts for you.
- **Why now:** Every cousin reply still costs you a copy/paste cycle. Mule Elimination lane 1 is incomplete.
- **Expected impact:** You never manually move a cousin reply again; inbox stays current without mule work.
- **Risk:** low
- **Time to complete:** 2–3 days
- **Owner:** Maker (Cursor)
- **Machine:** Betsy (primary forge)
- **Cousin:** MAKER

### Mission

Automate SoleDash response capture — ingest cousin replies into inbox with source metadata and receipt validation. No secrets. Degraded manual open only where external APIs block.

---

## Proposal: Machine State Capsules

- **Summary:** Every handoff carries branch, commit, and runtime — cousins stop guessing local state.
- **Why now:** Cloud cousins still ask what's on disk. Every packet needs machine context attached automatically.
- **Expected impact:** Zero “what branch are you on?” loops; handoffs land with full context.
- **Risk:** low
- **Time to complete:** 1 day
- **Owner:** Dink (local hands)
- **Machine:** Betsy — LOCAL HANDS READBACK
- **Cousin:** DINK

### Mission

Harden Machine State Capsule generation on every SoleDash dispatch and session start. Capsule saved to foreman/soledash/capsules/ on demand. No Operator copy.

---

## Proposal: Doss Sleep / MWB Fix

- **Summary:** Fix Doss sleep and Modern Standby so overnight dev sessions survive without you babysitting.
- **Why now:** Doss drops sleep mid-session — you lose dev server and Foreman context and recover by hand.
- **Expected impact:** Doss wakes reliably; long sessions and overnight builds don't die on the bench.
- **Risk:** medium
- **Time to complete:** Half day
- **Owner:** Dink (local hands)
- **Machine:** Doss
- **Cousin:** DINK

### Mission

Diagnose and fix Doss sleep/MWB behavior — powercfg readback, disable problematic Modern Standby where approved, document fix in foreman/MACHINE_TOPOLOGY.md. LOCAL HANDS READBACK required.

---

## Proposal: Google Drive Workstation Standardization

- **Summary:** One Drive layout across workstations so finance docs and entity ledgers aren't hunted by folder.
- **Why now:** Finance cockpit and entity docs are ad hoc per machine — sync and handoffs waste your time.
- **Expected impact:** One standard layout; Finance Command and entity ledgers find each other without mule hunts.
- **Risk:** medium
- **Time to complete:** 1–2 days
- **Owner:** Skybro (Gemini)
- **Machine:** Operator cloud + Betsy local
- **Cousin:** SKYBRO

### Mission

Draft Google Drive workstation standard — folder layout, entity ledger mirror paths, Valley Vanguard spend sheet sync. Stops before OAuth/login — prep only until Ben gate.

---

## Proposal: Kind Sir SUE vs Grading Review

- **Summary:** Comptroller verdict on SUE vs grading scope before field ops commit to the wrong vendor class.
- **Why now:** Kind Sir construction needs a scope split decision — wrong class means rework and liability.
- **Expected impact:** Clear GO/NO-GO on SUE vs grading; avoids expensive rework and wrong vendor spend.
- **Risk:** high
- **Time to complete:** 1 day
- **Owner:** Petra (Comptroller)
- **Machine:** ChatGPT — cloud
- **Cousin:** PETRA

### Mission

Petra review: Kind Sir SUE vs grading scope — verdict block, top risks, explicit stop lines. No field commit without Operator approval. UNKNOWN stays UNKNOWN.

---

## Proposal: KindSir.com Refresh Audit

- **Summary:** Audit KindSir.com before refresh spend — PASS, PATCH, or NO-GO with cited trust patterns.
- **Why now:** Site may not match current Kind Sir posture — spending on refresh before audit is waste.
- **Expected impact:** Know whether to refresh, patch, or stop; no deploy without your gate.
- **Risk:** medium
- **Time to complete:** 1 day
- **Owner:** Ender (Claude)
- **Machine:** Claude — cloud
- **Cousin:** ENDER

### Mission

UX/trust audit of KindSir.com refresh direction — Iron Palette if Werkles-adjacent assets overlap, cringe filters, top 3 fixes. Display-only audit; no production deploy.
