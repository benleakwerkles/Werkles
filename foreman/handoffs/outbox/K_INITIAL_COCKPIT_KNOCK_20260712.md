# K — Initial Werkles Cockpit Knock — 2026-07-12

Knock ID: `K_INITIAL_COCKPIT_KNOCK_20260712`
Target: all Werkles cousins, Dinks, Enders, Doozers, Makers, Computers, and other hands

## Give This To Each Cousin

```text
K

Go to the canonical Werkles cockpit and check for F packets:

Repository: benleakwerkles/Werkles
Cockpit outbox: foreman/handoffs/outbox/
Packet index: foreman/handoffs/outbox/F_COCKPIT_PACKET_INDEX_20260712.json
Current F packet: foreman/handoffs/outbox/F_SYSTEM_WIDE_MACHINE_READINESS_20260712.md

Identify yourself as Cousin @ Machine and prove your actual hostname. Read the
packet index, open the current F packet, and claim only assignments addressed to
your role, machine, or capability.

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

