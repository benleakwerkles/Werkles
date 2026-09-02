# VPG shorthand — Operator definition

Effective: 2026-07-17  
Lane: Werkles.com / G (Matching)  
Cadence note updated: 2026-07-24 (Operator: expand depth — don’t rush thin cycles)  
V canonized: 2026-07-29 (Operator: "I'll put Vision into the company canon")

## `V` — Vision (canon 2026-07-29)

| Letter | Meaning |
|--------|---------|
| **V** | **Vision** — the foreman seat authors the packet instead of waiting for one. Written to the outbox as a dated `*_V_*` card before work starts, so the decision trail exists even when the seat directs itself. |

Ben picked the letter arbitrarily for the foreman step in machine-team
cycles; Lady Jessica's read of it as "Vision" on 2026-07-29 was confirmed
and canonized. `VPGM` = author the vision packet, pull, execute, keep
momentum. V does **not** widen scope or approve gates — a V packet must
declare its own hard edges and stay inside the seat's lane.

## `B` — Broad (canon 2026-08-23)

| Letter | Meaning |
|--------|---------|
| **B** | **Broad** — work a larger project checkpoint across several materially different product areas and CBCC lanes instead of completing only the nearest isolated task. |

`BVPGM` = Broad Vision, Pull, Go, Momentum. The operating engine remains
`V → P → G → M`; Broad changes the width of the checkpoint, not the evidence
order. A Broad cycle must:

1. name the larger checkpoint and the distinct workstreams it contains;
2. author focused packets for the relevant actual CBCC lanes;
3. keep packet delivery, custody, terminal review, implementation, and
   post-build red-team status separate;
4. rotate reviewed work across those workstreams during Momentum rather than
   climbing down after the closest task;
5. preserve all existing budget, authority, provider, schema, production,
   push/deploy, privacy, and Human Gate boundaries.

Broad does not mean unbounded wandering, invented participation, or permission
to outrun receipts. It means coordinated progress toward the whole named
checkpoint.

## `P, G.`

| Letter | Meaning |
|--------|---------|
| **P** | Pull each seat’s latest packet / Flock state |
| **G** | Execute the **two strongest ideas** from each pulled packet and return receipts |

## Expanded cadence (Operator preference)

When Ben wants more depth than a thin status loop, prefer:

| Shorthand | Meaning |
|-----------|---------|
| **Double P** | Pull (1) cockpit / NEXT_ACTION / approvals **and** (2) outbox + active gate packets (soft live, open intake, HG-3→5, Dink execute) |
| **Triple G** | Execute **three** strongest in-scope ideas (not just hygiene + waiting card). Still no human-gate actions without exact phrases |

Default `P, G.` remains two G ideas. Expanded cadence does **not** approve gates.

## Notes

- Does **not** by itself approve human gates (push, production deploy, SQL, secrets, LLM flip) unless the packet’s allowed scope already includes them and a separate Operator phrase already cleared that gate.
- Seats pull **their** packets. Cross-seat packets are read for Flock state; execution stays inside the active seat’s allowed scope unless the packet names that seat as executor.
- Receipts must name: packets pulled, G ideas chosen (2 or 3), what ran, pass/fail, hard stops preserved.

Operator clarification (exact):

```text
P = pull their respective latest packet/Flock state; G = execute the two strongest ideas from each packet and return receipts.
```

Operator preference (2026-07-24):

```text
You can do like a double P, triple G or something. You work too fast.
```

## `M` — Momentum (Automatica Momentium v1)

Invented by Ben 2026-07-26 (first issued to Maker@Sally). Going
BrAeyenStation-wide.

`P, G, M` means: after finishing the G, **do not stop and wait**. Loop:

1. **Pull again.** If a new packet is waiting, service it (that's a fresh
   P, G).
2. **No packet?** Stay inside the lane you were already working. Finish
   anything incomplete there, or run **up to two of your own ideas** —
   in-lane, in-scope, no gates.
3. **After the two ideas, pull again.** If a packet arrived, service it.
   Otherwise close out with a receipt.

Purpose: keep momentum alive between created packets instead of idling.

Hard edges (unchanged by M):

- M never approves, says, or simulates a human-gate phrase.
- M ideas stay inside the seat's active lane and allowed scope. New lanes
  need a packet or an Operator word.
- Two self-directed ideas per M beat, then re-pull. No open-ended wandering.
- Receipts name the M ideas taken, same as G ideas.

Operator definition (exact):

```text
M means keep the Momentum going. This new command means to keep working inside
the lane you were already working to improve anything you hadn't completed, or
to try any ideas you have, up to two ideas. After your two ideas, check again
if you have any packets waiting. I am trying to keep momentum going in between
created packets.
```
