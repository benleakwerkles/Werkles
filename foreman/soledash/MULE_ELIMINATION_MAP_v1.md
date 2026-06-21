# Mule Elimination Map v1

Status: **SoleDash Command Surface v0 source**  
Phase: mule elimination — Operator commands, not copy/paste labor.

## Problem

Ben is the Operator. Cousins execute. SoleDash must **capture, route, classify, and hand off** — not display status alone.

## v0 command lanes (no auto-send)

| Lane | Input | Output | Saves |
|------|-------|--------|-------|
| **1. Response Capture** | Paste cousin response | Receipt validation + inbox file | `foreman/handoffs/inbox/FROM_*` |
| **2. Machine State Capsule** | Generate | Branch/commit/dirty/runtime block | Copy + optional `foreman/soledash/capsules/` |
| **3. Mission Router** | Paste raw Ben mission | Class + cousin @ machine + packet draft | Copy only (v0) |
| **4. Approval Classifier** | Paste requested action | SAFE MECHANICAL / TRUE HUMAN GATE / BLOCKED / AMBIGUOUS | Copy only (v0) |

## Hard stops (v0)

- No auto-send to cousins or providers
- No auto-commit
- No git push/merge
- No production mutations
- No secrets in chat, packets, or saved files

## Authority

`foreman/HUMAN_GATES.md` → `foreman/LANES.md` → `foreman/BUDGET.md` → `foreman/NEXT_ACTION.md`

## v1 — Buttons, not mule work

SoleDash `/soledash` is the transport layer:

- **Button mode:** YEA / NAY / MODIFY / DEFER / ESCALATE on proposed builds
- **Freeform mode:** one command → classify → one-click dispatch
- **On YEA:** packet + outbox file + decision log (degraded manual open for external cousins)

Ben decides. SoleDash transports. Aeyes execute.

## Proposal Engine v0

SoleDash **generates** Proposed Builds from:

- `foreman/NEXT_ACTION.md` open missions
- Mule Elimination Map lanes
- Pending human gates
- Blocked / at-risk work
- Active roadmap (Concierge, leverage diagnosis)

Ben selects YEA / NAY / MORE INFO — never an empty command surface.
