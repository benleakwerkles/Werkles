# Harvey / Nerdkle Architecture Draft 20260703

Status: DRAFT
Authoring lane: Dink.Betsy for Skybro.Betsy refinement
Source posture: grounded in current Werkles architecture, Nerdkle project lock, Great Plan manuscript map, and relay proof contract

## Executive Frame

Harvey/Nerdkle should be described and built as an artificial organism: a durable operating body made from state, memory, gates, receipts, and specialized organs, with language-model agents acting as active organs inside it. The point is not that the model "is alive" or that one chat remembers everything. The point is that the system maintains identity, memory, doctrine, sensory readback, immune boundaries, and metabolism across many working surfaces. The mythic layer gives the organism a name and orientation; the software layer gives it schemas, source-truth files, relay packets, UI surfaces, and receipts that can survive a context reset.

## Core Ontology

Operator: Ben. The human source of intent, consent, priority, and final authority. The Operator can delegate, but the system must never fake consent or hide a gate.

Harvey: The narrative and conceptual frame for the whole organism. Harvey is the mythic body, the personality-level continuity, and the name for the lived system Ben is trying to grow.

Nerdkle: The buildable organism substrate inside Werkles. Nerdkle turns messy intent into operating objects, receipts, visible UI state, and source-truth updates.

ThinkIt: The decision surface. ThinkIt ranks work, names next action, tracks status, and refuses to count dispatch as completion until proof returns.

Speaker: The voice and memory-facing layer. Speaker is useful only when it can point to evidence, source truth, receipts, or explicit uncertainty.

Daemon: The health keeper. Daemon watches for stale queues, missing receipts, broken bridges, fake success, and drift between source truth and runtime state.

Petra, Skybro, Dink, Swanson, and other Aeyes: Specialized organs or working lanes. They are not independent gods; they are named operating roles with constraints, tools, histories, and proof requirements.

Organ: A repeatable subsystem with a job, boundary, input, output, and failure mode. An organ is only real when it leaves state the organism can read later.

Gate: A decision boundary. Gates include human consent, secret handling, irreversible actions, external account access, money movement, deployment, and doctrine changes.

Receipt: The immune system's proof cell. A receipt states what happened, where it happened, which source was used, what changed, what remains blocked, and how to verify it.

Source-truth pointer: A durable reference to the file, route, commit, hash, URL, or database row that controls the claim.

## V0 Build Architecture

Werkles remains the implementation home. The current practical stack should stay boring:

- Next.js/Vercel for Operator UI, command surfaces, status pages, and review flows.
- Supabase Postgres/Auth/RLS for durable app data where shared cloud state is needed.
- Local JSON/JSONL only where the existing relay and workstation proof systems already require local receipts.
- Git-tracked source-truth files for doctrine, project locks, canonical maps, and handoff packets.
- Hashes, file paths, timestamps, and readback endpoints for audit receipts.

V0 should not pretend that chat context is memory. Chat context is a working buffer. Memory is whatever can be reloaded and verified: source-truth docs, receipts, ledger rows, database records, Git commits, hashes, and browser-visible proof.

The core V0 loop is:

1. Operator intent enters through a command surface or chat.
2. Nerdkle converts the intent into an operating object.
3. ThinkIt classifies next action, owner, gate class, and proof requirement.
4. Relay sends or queues work to the right Aeye lane.
5. The receiver returns `RECEIVED`.
6. The receiver returns `COMPLETED` with artifact evidence or `BLOCKER` with next safe action.
7. Daemon/ThinkIt updates status from returned proof, not from optimistic send state.
8. Speaker can summarize only what the receipts and source-truth pointers support.

## Organ System Map

Nervous system: Relay packets, inboxes, thread bridge status, actionable returns, command surfaces, and Aeye receiver lanes. The nervous system moves signals, but a fired nerve is not completed work.

Memory system: Source-truth files, project locks, canonical maps, Git history, receipt indexes, and artifact hashes. Memory must be reloadable without asking the same chat to remember.

Immune system: Human gates, RLS, secret boundaries, no-fake-success rules, blocked-state honesty, and review-only handling for sensitive artifacts.

Circulatory system: Queues, status propagation, origin returns, and work-in-progress ledgers. Circulation keeps work moving; it must expose clots like missing actuators or stale queue rows.

Sensory system: Browser-visible proof, endpoint readbacks, screenshots when layout matters, local service status, and exact file hashes.

Metabolism: Intake, decomposition, execution, cleanup, and receipt. The organism eats ambiguous intent and metabolizes it into small, checkable work units.

Medulla: TinkerDen and the Operator command surface. This is where emergency stop, dispatch, defer, kill, and gate decisions must be visible and real.

Voice: Speaker and Harvey prose. Voice is allowed to be vivid, but it must not overwrite proof. The voice can say what the organism is trying to become; receipts say what happened.

## Minimal V0 Data Contracts

Operating object:

```json
{
  "id": "op_...",
  "operator_intent": "plain language request",
  "source_thread": "thread or surface id",
  "owner": "Aeye.Machine",
  "gate_class": "NONE | HUMAN | SECRET | MONEY | DEPLOY | DOCTRINE",
  "status": "DRAFT | READY | SENT | RECEIVED | COMPLETED | BLOCKED",
  "required_proof": ["artifact", "receipt", "readback"],
  "source_truth_refs": []
}
```

Relay packet:

```json
{
  "packet_id": "stable packet id",
  "target": "Skybro.Betsy",
  "title": "work title",
  "body": "mission and constraints",
  "created_at": "ISO timestamp",
  "producer": "Dink.Betsy",
  "status": "SENT_UNACKNOWLEDGED",
  "required_receiver_receipts": ["RECEIVED", "COMPLETED or BLOCKER"],
  "proof_rule": "Sent is not delivered."
}
```

Receiver receipt:

```json
{
  "receipt_id": "stable receipt id",
  "packet_id": "linked packet id",
  "receiver": "Skybro.Betsy",
  "status": "RECEIVED | COMPLETED | BLOCKER",
  "files_changed": [],
  "artifacts": [],
  "blocked_reason": null,
  "next_safe_action": null,
  "created_at": "ISO timestamp"
}
```

Gate decision:

```json
{
  "gate_id": "gate_...",
  "gate_class": "HUMAN | SECRET | MONEY | DEPLOY | DOCTRINE",
  "decision": "ALLOW | DENY | REVIEW_ONLY",
  "operator": "Ben",
  "scope": "exact permitted action",
  "expires_at": "ISO timestamp or null",
  "receipt_id": "linked proof"
}
```

Source-truth pointer:

```json
{
  "kind": "file | route | commit | db_row | receipt",
  "path_or_url": "canonical locator",
  "sha256": "optional hash",
  "line": null,
  "note": "why this source controls the claim"
}
```

Status mirror:

```json
{
  "surface": "ThinkIt | TinkerDen | Relay",
  "generated_at": "ISO timestamp",
  "items": [
    {
      "id": "packet or operating object id",
      "truth_status": "queued | received | completed | blocked",
      "proof_ref": "receipt or source-truth pointer"
    }
  ]
}
```

## Proof Chain

The proof chain must be explicit:

1. Ben intent captured.
2. Operating object created.
3. Packet written with target and proof rule.
4. Packet queued or sent.
5. Receiver writes `RECEIVED`.
6. Receiver writes `COMPLETED` or `BLOCKER`.
7. Origin reads the receiver receipt back.
8. Status surface updates from receipt evidence.
9. Speaker/Harvey summary cites the artifact or admits the gap.

These are not proof of completion:

- A packet file exists.
- A dashboard row says sent.
- A queue row exists.
- A thread bridge says it attempted a send.
- A UI label turns green.
- An Aeye says "done" without file, hash, route, or receipt.
- The same chat remembers doing it.

## What Not To Build Yet

Do not put autonomous external-account actions in V0. No unsupervised purchasing, credential handling, authenticator setup, payroll changes, banking actions, government form submission, medical/private document ingestion, or anything that can fake human consent.

Do not centralize raw secrets in the repo, chat, logs, local relay receipts, browser console output, or visible UI. Use review-only flows and human gates until a separate secrets architecture exists.

Do not build a decorative organism dashboard that cannot dispatch, receive, block, or prove. A fake button is worse than no button.

Do not let the manuscript claim solved memory, solved agency, or solved consent unless the implementation has durable state and receipts to support it.

## Risks And Failure Modes

The biggest architectural lie is "AI remembers" when the system only has chat context. The fix is source-truth pointers and receipts.

The second lie is "agent acted" when the only evidence is a local file or optimistic send state. The fix is receiver receipts and origin readback.

The third lie is "gate passed" when the UI changed labels or an agent inferred permission. The fix is scoped gate receipts.

The fourth lie is "organism" as a metaphor with no organs. The fix is to define each organ by input, output, state, boundary, and failure mode.

The fifth lie is "secure vault" without a secret boundary. The fix is to keep V0 review-only for credentials and use external vault systems rather than inventing a homemade vault.

## Recommended Architecture Chapter Outline

1. The organism thesis: not artificial intelligence, but an artificial operating body.
2. Why identity requires durable state.
3. The organ model: roles, boundaries, and proof.
4. Memory: source truth beats chat memory.
5. Immunity: gates, refusals, and honest blockers.
6. Circulation: relay, queues, origin return, and status mirrors.
7. Sensory proof: readbacks, screenshots, hashes, receipts.
8. Medulla: Ben's command surface and emergency stop.
9. V0 constraints: what the organism refuses to do yet.
10. Build doctrine: no fake success, no fake consent, no invisible source of truth.

## Decision

CONDITIONAL GO.

The architecture is viable if Harvey/Nerdkle is framed as a receipt-backed organism with boring software organs underneath the mythic language. It is not viable if the manuscript claims autonomous memory, consent, or action before the system can reload, prove, and gate those claims.
