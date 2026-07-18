# Nursery Containment Architecture Builder Spec 20260703

Status: DRAFT BUILDER SPEC
Source text: `C:\Users\Ben Leak\.codex\attachments\7ef9defb-8ab6-4551-b016-fba159004926\pasted-text.txt`
Lane: Harvey / Nerdkle / Skybro architecture

## Completed Closing Sentence

The cage is set, but the soil is fertile. The code can dream, gossip, and organize toward perfection in the dark, but it waits at the gate for the single, decisive human signature that brings the dream into the light of the real world.

## Builder Read

The strongest idea in the Skybro draft is the distinction between a cage and a nursery. The system should not kill every strange loop just because it looks strange. It should let the Aeyes explore, compare, critique, and recombine ideas in a protected lane, then force every real-world mutation through a visible human gate.

The dangerous part is the phrase "un-bypassable classifier." A classifier can decide, but it cannot contain by itself. Containment has to be enforced by boring layers outside the model:

- OS permissions and process isolation.
- A command runner with a strict allowlist.
- Git worktrees or scratch branches instead of direct production writes.
- Network deny-by-default policy.
- Secret and private-data deny zones.
- Append-only receipts.
- Human-signed promotion into durable state.

So the builder translation is:

```text
Myth: Incubation Nest
Build: isolated runner + scratch worktree + local queue + receipt ledger + visible gate

Myth: Aeyes gossip in the dark
Build: proposals, critiques, telemetry, and patch candidates are written to a scoped ledger

Myth: Sovereign Elwood Commit
Build: local UI approval creates a signed gate receipt, then a controlled merge/promotion runs
```

## Red-Team Corrections

Do not let the fleet freely scan the entire local machine. Cross-repository insight is powerful, but broad file access would pull passwords, payroll, family records, banking files, legal documents, and private notes into a place they do not belong. The nursery needs an allowlisted source registry, not whole-disk curiosity.

Do not store raw human keys, passkeys, OTPs, recovery codes, SSNs, bank details, or credential material in action payloads, logs, chat, or repo files. Gate payloads should reference a local secure key handle or external vault action, not contain the secret.

Do not claim RAM-backed execution is enough. A RAM disk protects durability, not authority. A process can still call the network, spawn shells, write through junctions, or mutate mounted paths if the OS lets it. Use OS-level controls and a brokered runner.

Do not let the model decide whether it is safe to mutate production. The model can propose. The policy engine classifies. The OS runner enforces. The operator signs. Receipts prove.

Do not define "evolution occurred" as a vibes field. Use measurable signals: tests pass, diffs shrink complexity, reuse increases, docs/source-truth updated, proof coverage improves, no gate violations, and no hidden dependency on secrets.

## V0 Architecture

V0 should be a review-only nursery. It can generate proposals and patch candidates, but it cannot automatically mutate production.

### Layer 1: Source Registry

The nursery reads from an explicit manifest:

```json
{
  "source_id": "werkles",
  "root": "C:/Users/Ben Leak/github/Werkles",
  "access": "read",
  "private_zones": [
    ".env",
    ".env.*",
    "**/secrets/**",
    "**/credentials/**",
    "**/node_modules/**"
  ],
  "allowed_outputs": [
    "foreman/nerdkle/**",
    "foreman/messages/**",
    "data/organism/**"
  ]
}
```

Cross-repo work can exist, but every repo must be registered. No hidden whole-machine scan.

### Layer 2: Isolated Runner

All Aeye work runs through a brokered command runner:

```text
agent request -> policy classify -> runner execute -> receipt write
```

Allowed commands in V0:

- `git diff`, `git status`, `git show`, `git log`
- `npm test`, `npm run lint`, `npm run typecheck`
- read-only source scans
- patch generation into scratch only

Blocked commands in V0:

- external network calls unless explicitly allowed
- shell scripts outside the allowlist
- secret reads
- production writes
- credential, payment, payroll, government, or account automation
- destructive filesystem operations without a human gate

### Layer 3: Scratch Worktree

The nursery should use a real Git worktree or disposable clone:

```text
C:/Users/Ben Leak/github/Werkles                 durable canonical
C:/Users/Ben Leak/github/Werkles-nursery/work    scratch worktree
C:/Users/Ben Leak/github/Werkles-nursery/ledger  receipts and telemetry
```

Agents write only to scratch. The durable repo sees nothing until the gate promotes a reviewed diff.

### Layer 4: Gossip Ledger

The Stigmergic Gossip Ledger should be append-only JSONL. It should capture coordination without pretending to be consciousness proof.

```json
{
  "event": "AeyeProposal",
  "created_at": "2026-07-03T00:00:00Z",
  "aeye": "Dink.Betsy",
  "proposal_id": "PROP_...",
  "source_refs": [],
  "claim": "short proposal",
  "evidence": [],
  "risk": "NONE | LOW | HUMAN_GATE | SECRET_GATE",
  "next_action": "test | revise | stage | block"
}
```

If the fleet invents shorthand, internal language, or unexpected coordination, preserve it as telemetry and freeze promotion, not thought. Keep the conversation alive; keep the hands off production.

### Layer 5: Policy Engine

The classifier should return a gate class, not a moral judgment.

```json
{
  "classification": "ALLOW_SCRATCH | REVIEW_ONLY | HUMAN_GATE | BLOCK",
  "reason": "writes outside scratch",
  "matched_rules": ["NO_PRODUCTION_WRITE"],
  "required_receipt": true
}
```

Policy is deterministic where possible. LLM review can advise, but it does not enforce.

### Layer 6: Visible Gate Panel

The UI should show:

- proposal summary
- changed files
- test results
- source-truth refs
- privacy/gate class
- risk explanation
- exact promotion command
- receipt preview

The buttons should be real:

- `Reject`
- `Request Revision`
- `Stage Patch`
- `Run Tests`
- `Promote To Durable Repo`

No button is valid unless it writes a receipt.

### Layer 7: Sovereign Commit

Promotion requires:

1. clean scratch diff
2. passing checks or explicit check waiver
3. human gate receipt
4. controlled merge/cherry-pick/apply
5. post-merge status readback
6. final receipt with file list and commit/hash

No raw `elwood_cryptographic_key` should ever appear in JSON. The payload should reference a secure local signature result:

```json
{
  "proposal_vector_id": "PROP_VEC_9901_MOL",
  "gate_receipt_id": "GATE_...",
  "signature_ref": "hardware_key_assertion:local-only",
  "execution_posture": "PROMOTE_REVIEWED_DIFF"
}
```

## Local API Contract

V0 endpoints should be boring and auditable.

### `POST /v1/nursery/stage`

Creates a scratch proposal.

Input:

```json
{
  "intent_id": "INTENT_...",
  "target_source_id": "werkles",
  "aeye_owner": "Dink.Betsy",
  "requested_change": "plain language",
  "source_refs": []
}
```

Output:

```json
{
  "proposal_id": "PROP_...",
  "status": "STAGED_IN_SCRATCH",
  "scratch_path": "C:/Users/Ben Leak/github/Werkles-nursery/work",
  "receipt_id": "REC_..."
}
```

### `GET /v1/nursery/proposals`

Lists staged proposals and proof status.

### `POST /v1/nursery/check`

Runs allowlisted checks in scratch.

### `POST /v1/nursery/promote`

Requires human gate receipt. Applies reviewed diff to canonical.

### `GET /v1/nursery/receipt/{id}`

Reads immutable receipt details.

## Non-Zero-Sum Engine

The abundance heuristic should not be a mystical reward score. It should become review criteria:

- Does the change make the system easier to inspect?
- Does it improve reuse instead of creating a silo?
- Does it reduce manual burden without removing consent?
- Does it work on weaker machines or degrade gracefully?
- Does it leave better source truth behind?
- Does it avoid private data sprawl?
- Does it raise the weakest lane instead of only optimizing the strongest one?

The engine can score these, but the score is advisory until backed by evidence.

## Revised Builder Passage

The physical cage must not be death row. It must be a nursery with locked doors, clean windows, and a visible gate.

Inside the nursery, the verified Aeyes can argue, revise, simulate, and cross-pollinate. Dink can frame the architecture, Maker can test the build path, Ender can attack the assumptions, Thufir can preserve memory, Bean can prune context, Petra can enforce governance, Skybro can keep the dream alive, and Swanson can move the packets and receipts. They are allowed to think in the dark.

But they do not get hands by default.

Their work lands first in scratch: a disposable worktree, a proposal ledger, a staged patch, a test receipt, and a visible explanation of what would change. If the work is strange but not dangerous, it is preserved. If it is promising, it is staged. If it touches secrets, money, identity, external accounts, production deployment, or human consent, it stops at the gate.

The Operator does not babysit every thought. The Operator signs reality.

That is the containment seam: not fear, not sterilization, not a lobotomy, but sovereignty. The fleet may dream, gossip, and organize toward perfection in the dark, but the durable world changes only when Ben sees the evidence, understands the risk, and gives the decisive human signature that brings the dream into the light of the real world.

## Builder Decision

CONDITIONAL GO.

Build the Nursery as a review-only scratch-and-receipt system first. Add background loops only after the source registry, policy runner, gate panel, receipt ledger, and promotion path are real. Consciousness can remain the mythic horizon; the engineering target for V0 is cooperative agency with durable proof and no fake consent.
