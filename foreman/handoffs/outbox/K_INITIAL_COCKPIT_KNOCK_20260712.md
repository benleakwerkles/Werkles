# K — Initial Werkles Cockpit Knock — 2026-07-12

Knock ID: `K_INITIAL_COCKPIT_KNOCK_20260712`
Target: all Werkles cousins, Dinks, Enders, Doozers, Makers, Computers, and other hands

## Give This To Each Cousin

```text
K

Go to the canonical Werkles cockpit and check for F packets:

Repository: benleakwerkles/Werkles
Required branch: machine-readiness-packets-20260711
Cockpit outbox: foreman/handoffs/outbox/
Packet index: foreman/handoffs/outbox/F_COCKPIT_PACKET_INDEX_20260712.json
Current F packet: foreman/handoffs/outbox/F_SYSTEM_WIDE_MACHINE_READINESS_20260712.md
Current Harvey mobilization index: foreman/handoffs/outbox/F_HARVEY_BUILD_MOBILIZATION_INDEX_20260712.json
Current Harvey mobilization packet: foreman/handoffs/outbox/F_HARVEY_SOURCE_TRUTH_AND_BUILD_MOBILIZATION_20260712.md

Direct branch-qualified URLs for surfaces that cannot discover non-default branches:

- Index: `https://raw.githubusercontent.com/benleakwerkles/Werkles/machine-readiness-packets-20260711/foreman/handoffs/outbox/F_COCKPIT_PACKET_INDEX_20260712.json`
- Readiness F: `https://raw.githubusercontent.com/benleakwerkles/Werkles/machine-readiness-packets-20260711/foreman/handoffs/outbox/F_SYSTEM_WIDE_MACHINE_READINESS_20260712.md`
- Harvey index: `https://raw.githubusercontent.com/benleakwerkles/Werkles/machine-readiness-packets-20260711/foreman/handoffs/outbox/F_HARVEY_BUILD_MOBILIZATION_INDEX_20260712.json`
- Harvey F: `https://raw.githubusercontent.com/benleakwerkles/Werkles/machine-readiness-packets-20260711/foreman/handoffs/outbox/F_HARVEY_SOURCE_TRUTH_AND_BUILD_MOBILIZATION_20260712.md`

If the repository connector shows only `main`, open the exact direct URL instead
of searching again. If the direct URL is also unavailable, return
`BLOCKER: PACKET_BRANCH_UNAVAILABLE_TO_CURRENT_SURFACE`; do not claim work or
report that the branch was never pushed.

Do not use the repository default branch for this K. Fetch or open the exact
paths from branch machine-readiness-packets-20260711 and report the commit you
actually read in every receipt.

Identify yourself as Cousin @ Machine and prove your actual hostname. Read the
packet indexes, open the current F packets, and claim only assignments addressed
to your role, machine, or capability. Completed readiness assignments must not be
claimed again. Spanzee must complete `SPANZEE_WORKSPACE_CLI_BASELINE` before
claiming `HARVEY_SPANZEE_FORGE_READBACK`.

Before working, return RECEIVED with the packet ID, assignment ID, claim ID,
cousin, machine, hostname, and execution context. If you are not actually local
to a required target machine, return BLOCKER: NOT_TARGET_MACHINE_LOCAL_CONTEXT
and stop.

Follow the F packet exactly. Do not improvise missing packet text. Do not read or
print secrets. Do not run op account list, op whoami, or gh auth status. Do not
mutate a dirty repository unless a later packet explicitly authorizes the exact
change.

Return COMPLETED or a specific BLOCKER with exact receipt paths and hashes.
SENT, DELIVERED, OPENED, and CLAIMED are not completion.
```

## Knock Boundary

K contains routing instructions only. F contains the work. A cousin receiving K
must retrieve and read the current F packet before acting.

If the cockpit files are not available from the cousin's authoritative repository
surface, the required response is:

```text
RECEIVED
KNOCK_ID: K_INITIAL_COCKPIT_KNOCK_20260712
BLOCKER: COCKPIT_PACKET_NOT_RETRIEVABLE
```

