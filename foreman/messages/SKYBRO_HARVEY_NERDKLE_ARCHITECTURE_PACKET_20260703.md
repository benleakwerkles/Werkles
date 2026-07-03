# SKYBRO HARVEY/NERDKLE ARCHITECTURE PACKET 20260703

PACKET_ID: SKYBRO_HARVEY_NERDKLE_ARCHITECTURE_PACKET_20260703
ORIGIN: Dink.Betsy
TARGET: Skybro.Betsy
PROJECT: Harvey / Nerdkle Architecture
PRIORITY: HIGH
MODE: Architecture drafting, source-truth grounded, receipt-backed

## Mission

Help write the architecture for Harvey/Nerdkle as an artificial organism system, not a loose AI feature pile. Translate the mythic organism language into boring, buildable software architecture that Werkles can implement, test, and prove with receipts.

The output should preserve the voice of the manuscript, but every technical claim needs a practical substrate: queues, event logs, state objects, policy gates, UI surfaces, source pointers, and receipts.

## Required Sources

Use these source-truth files from the canonical Werkles checkout:

- `docs/architecture.md`
- `company/WERKLES_CODE_AND_ARCHITECTURE.md`
- `foreman/nerdkle/NERDKLE_PROJECT_LOCK.md`
- `source-truth-plan/BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP.md`
- `source-truth-plan/references/betsy_desktop_nerdkle_the_book/The_Great_Plan_Working_Master_Manuscript.md`
- `source-truth-plan/references/betsy_desktop_nerdkle_the_book/TO_SKYBRO_THUFIR_TECH_MAPPING_PACKET.md`
- `source-truth-plan/AEYE_RELAY_CONTRACT_V0.md`
- `source-truth-plan/references/swanson_relay_build_20260629/README.md`
- `source-truth-plan/references/swanson_relay_build_20260629/contracts/THINKIT_RELAY_MERGE_HANDOFF.md`
- `source-truth-plan/references/swanson_relay_build_20260629/contracts/THINKIT_RELAY_MERGE_CONTRACT.json`
- `source-truth-plan/references/swanson_relay_build_20260629/receipts/SWANSON_DOSS_THINKIT_RELAY_MERGE_PREP_RECEIPT_20260629.json`
- `data/thinkit/thinkit_status.md`

## Current Local Truth

Dink ran the relay handoff packet far enough to confirm the canonical repo and live surfaces, but not far enough to claim full relay health.

- Canonical repo: `C:\Users\Ben Leak\github\Werkles`
- Repo remote: `https://github.com/benleakwerkles/Werkles.git`
- Branch: `main`
- Local relay API base checked live: `http://10.1.10.8:3339`
- ThinkIt surface checked live: `http://10.1.10.8:3342/thinkit`
- Thread bridge actuator status: `MISSING`
- Missing actuator path reported by live status: `C:\Users\BenLeak\.codex\automations\nerdkle-aeye-thread-bridge\automation.toml`

Do not treat local queue placement, `SENT`, or `SENT_TO_CODEX_THREAD` as completion. Completion requires receiver readback or a blocker receipt.

## Deliverable

Return an architecture packet or memo with these sections:

1. `EXECUTIVE FRAME`
   - One-paragraph explanation of Harvey/Nerdkle as an artificial organism.
   - Keep it legible to Ben and buildable by agents.

2. `CORE ONTOLOGY`
   - Define Operator, Harvey, Nerdkle, ThinkIt, Speaker, Daemon, Petra, Skybro, organs, gates, receipts, and source-truth pointers.
   - Separate story-language from implementation-language without killing either one.

3. `V0 BUILD ARCHITECTURE`
   - Map the organism to the current Werkles stack: Next.js/Vercel UI, Supabase/Postgres/Auth/RLS where appropriate, local relay JSONL/receipts where current relay requires it, and file artifacts only when they are the honest source of truth.
   - Respect the existing rule: no raw secrets, SSNs, banking docs, OTPs, recovery codes, or private credentials in repo, chat, browser logs, or local relay receipts.

4. `ORGAN SYSTEM MAP`
   - Nervous system: packet routing, inboxes, relay status, thread bridge, command surfaces.
   - Memory system: source-truth files, receipt indexes, artifact hashes, canonical maps.
   - Immune system: policy gates, RLS, secret boundaries, blocked states, no fake success.
   - Circulatory system: queued work, status propagation, origin return, actionable returns.
   - Sensory system: browser-visible proof, readbacks, screenshots when needed.
   - Metabolism: task intake, decomposition, execution, receipt, review, cleanup.
   - Medulla: TinkerDen / Operator command surface and hard stop rules.

5. `DATA CONTRACTS`
   - Propose minimal V0 schemas for:
     - Operating object
     - Relay packet
     - Receiver receipt
     - Gate decision
     - Source-truth pointer
     - Status mirror
   - Keep the contracts small enough to build now.

6. `PROOF CHAIN`
   - Show the exact chain from Ben intent to packet to receiver readback to artifact and origin return.
   - Explicitly name states that are not proof: local file exists, sent, queued, dashboard row, self-report without readback.

7. `WHAT NOT TO BUILD YET`
   - Name what should stay out of V0: autonomous external-account actions, credential handling, financial/medical/private document ingestion, unsupervised purchasing, and anything that can fake human consent.

8. `RISKS AND FAILURE MODES`
   - Identify architectural lies the manuscript must avoid: "AI remembers" when only context exists, "agent acted" when no receipt exists, "gate passed" when only a UI label changed, and "organism" language without durable state.

9. `RECOMMENDED DOC OUTLINE`
   - Provide a concrete outline Ben can hand to Harvey/Nerdkle as the architecture chapter or architecture appendix.

10. `DECISION`
   - Return one of: `GO`, `CONDITIONAL GO`, or `NO-GO`.
   - Include the shortest honest reason.

## Response Rules

First response must include:

```text
RECEIVED
PACKET_ID: SKYBRO_HARVEY_NERDKLE_ARCHITECTURE_PACKET_20260703
TARGET: Skybro.Betsy
```

Final response must include one of:

```text
ARTIFACT
PACKET_ID: SKYBRO_HARVEY_NERDKLE_ARCHITECTURE_PACKET_20260703
FILES_CHANGED:
RECEIPT:
SUMMARY:
```

or:

```text
BLOCKER
PACKET_ID: SKYBRO_HARVEY_NERDKLE_ARCHITECTURE_PACKET_20260703
BLOCKER:
NEXT_SAFE_ACTION:
```

If the relay bridge is unavailable, still complete the architecture work in the thread and clearly state that relay-origin proof is blocked by the missing actuator.
