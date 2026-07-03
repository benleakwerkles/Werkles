# CHANGE_CAPSULE_G_MEANS_THREE_COPY_BLOCK_MEALS_2026-06-27

STATUS: ACTIVE

TYPE: Formatting / boundary rule, not architecture.

OWNER: Petra@Sally

STREAM: PACKET / RECEIPT OPS

PACKET_ID: FOOD_1_G_COMMAND_RULE_HARDENING_2026-06-27

TIMESTAMP: 2026-06-27T18:03:00Z

BOOTSTRAP-SAFE SENTENCE:
G means exactly 3 standalone copy-block meal packets.

## Rule

On `G` or `g`, return exactly 3 meals.

Each meal must be one standalone, single-click copy-block packet.

No paragraph-only meals.

No vague assignments.

Every assignment must use `Aeye@Machine` unless the packet is addressed to the current thread itself.

No fake destinations.

No `Ender@Sally` until Sally has more RAM.

Do not overfeed `Swanson@Doss`.

## Required Packet Fields

Each meal packet must include:

```text
PACKET_ID:
TO:
STREAM:
MISSION:
CONTEXT:
DO:
DO_NOT:
OUTPUT_REQUIRED:
RECEIPT_REQUIRED:
```

## Receipt Boundary

`ACK` means receipt only, not completion proof.

The following words are not proof:
- `sent`
- `posted`
- `working`
- `fixed`
- `deployed`
- `live`

Proof requires a receipt, blocker, or artifact that names what happened and where the evidence lives.

## Failure Condition

This rule failed if Ben has to re-explain that `G` means exactly 3 copy-block meal packets, or if a reply gives loose bullets, prose-only assignments, fake destinations, or unverifiable completion claims.

## Non-Architecture Scope

This capsule does not re-decide TinkerDen, Medulla, Nerdkle, Feral, routing, or dispatch architecture.

This capsule only hardens the packet format and receipt boundary for `G` / `g` commands.

