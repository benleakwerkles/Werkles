# TO_DINK — SkyPooka Queue Pickup Lane

**From:** Maker (Cursor Cloud Agent, `CURSOR_CLOUD_CONTAINER`)
**To:** Dink (any hands-capable Dink on Betsy, Doss, or Sally)
**Mission:** SKYPOOKA_MOBILE_QUEUE_PICKUP
**Dispatch class:** AUTO_LOAD_HUMAN_SEND
**Receipt required:** Y
**Issued:** 2026-07-04
**Human gate:** No for local list/ack/done/archive readback. Ben gate remains for any actual relay send, push, merge, or deploy.

---

## Context

SkyPooka is the mobile operator surface (Mobile Nerdkle · Mobile Werkles) at `/skypooka`. When Ben taps **FIRE** or **HOLD** on a relay card from his phone, nothing is sent. The phone writes a queue artifact into the repo and waits for a desk-side Dink to pick it up.

This packet formally hands Dink the pickup lane so it is durable scope, not chat memory.

Lane doctrine: `foreman/LANES.md` → `## Lane: SkyPooka Mobile Nerdkle`.

---

## Branch State

SkyPooka currently lives on the Cloud feature branch, not `main`:

```text
branch: cursor/skypooka-mobile-v0-233f
PR: https://github.com/benleakwerkles/Werkles/pull/31
```

Until that branch merges (Ben gate), a Dink working the queue must check out the feature branch or wait for merge. Do not cherry-pick to `main`.

---

## Required Local Hands Readback

Any Dink starting this lane must begin with LOCAL HANDS READBACK per `foreman/EXECUTION_CONTEXT_RULES.md`:

- machine name
- repo path (canonical: `C:\Users\<user>\github\Werkles`)
- branch
- commit
- working tree status
- terminal availability
- localhost running yes/no
- port in use

---

## The Queue

| Purpose | Path |
|---------|------|
| Mobile FIRE requests | `foreman/skypooka/fire-queue/` |
| Mobile HOLD requests | `foreman/skypooka/hold-queue/` |
| Completed items | `foreman/skypooka/archive/` |
| Append-only pickup log | `foreman/skypooka/QUEUE_LOG.md` |
| Lane instructions | `foreman/skypooka/README.md` |
| Drain tool | `scripts/foreman/skypooka-queue.mjs` |

Queue artifact shape (JSON): `id`, `action` (fire|hold), `card_id`, `subject`, `target`, `path` (handoff doc), `created_at`, `status` (queued → acked → done), `source: "skypooka-mobile"`.

---

## Dink Commands

```bash
npm run skypooka:queue -- list
npm run skypooka:queue -- ack <id> --by DINK_<MACHINE>
npm run skypooka:queue -- done <id> --note "how it was handled"
npm run skypooka:queue -- archive
```

Rules:

1. `ack` before working an item. The phone shows pickup state, so ack is what tells Ben a Dink has the baton.
2. `done` requires a note saying what actually happened (delivered via courier run X, held per Ben, rejected because Y).
3. `archive` only moves `done` items. Never delete queue artifacts.
4. All transitions append to `QUEUE_LOG.md`. Do not edit that log by hand.

---

## What FIRE Pickup Means (and does not mean)

A `fire` item is Ben saying "move this handoff." Pickup means:

1. Read the handoff doc at the artifact's `path`.
2. Route it through the existing relay lane (relay courier / Edge Dispatch Bay) **under that lane's own rules and gates**.
3. `done` the queue item with a note referencing the courier run or receipt.

Pickup does **not** mean:

- auto-sending anything (`neverAutomates` in `relay-courier.config.json` still applies — Ben Send remains the gate)
- approving human gates
- push, merge, deploy, SQL, secrets, provider calls

A `hold` item means Ben wants the card parked: note the hold in the relevant lane and `done` the queue item with a hold note.

---

## Stop Conditions

- Queue empty → nothing to do, no receipt needed beyond readback.
- Item requires an actual send → stop at Ben Send gate as always.
- Item references a handoff path outside `foreman/handoffs/` → treat as invalid, mark `done` with a rejection note, report as a blocker.

---

## Required Receipt

Return to `foreman/handoffs/inbox/` as `FROM_DINK_SKYPOOKA_QUEUE_PICKUP_<timestamp>.md`:

```text
PACKET: TO_DINK_SKYPOOKA_QUEUE_PICKUP
MACHINE:
BRANCH:
COMMIT:
ITEMS_FOUND:
ITEMS_ACKED:
ITEMS_DONE:
ITEMS_ARCHIVED:
BLOCKERS:
QUEUE_LOG_TAIL: (last 3 lines)
```

---

*Proof of lifecycle: `foreman/skypooka/QUEUE_LOG.md` already contains a seeded ack → done → archive receipt from the Cloud build session (2026-07-03).*
