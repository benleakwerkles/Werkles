# Harvey Local Integration And Fleet Activation

Status: `APPROVED_IN_PROGRESS`  
Lane: `Harvey Local Integration And Fleet Activation`  
Operator approval: `Get going, I don't want to mule it. Looks like a plan to me. Let me know if I need to send out any F/Knock packets`  
Recorded: `2026-07-13T22:55:40-04:00`

## Execution context

- Cousin: `Foreman @ Doss via Codex Desktop`
- Machine: `Doss`
- Hostname: `DOSS`
- Runtime: `CODEX_LOCAL`
- Canonical checkout: `C:\Users\BenLeak\github\Werkles`
- Starting branch: `main`
- Starting commit: `3b407e66385a56d74a8bb8356b854c20f2494b3a`
- Starting working tree: `69 dirty entries; 0 staged`

## Objective

Make Harvey actionable without using Ben as the packet courier:

1. isolate and validate the Harvey dashboard, API, Handeye, and their truthful cockpit inputs;
2. commit only that bounded implementation on a local integration branch;
3. use standing Codex routes and LAN Handeyes to deliver current packets;
4. dispatch and close the Spanzee workspace/CLI baseline assignment;
5. preserve every unrelated dirty file.

## Mandatory crew and review boundary

Product-code mutation may not begin until the initial independent findings are
returned from all three seats below:

- `Maker/Ender` — operator UX, accessibility, and Sally live-preview acceptance;
- `Bean` — independent hostile red team with blocker authority;
- `Petra` — independent synthesis and GO/NO-GO reviewer;
- `Swanson/Dink` — Sally transport, topology, and receipt proof.

The Foreman implementing the change may run ordinary checks but may not count
its own review as the red team. Bean findings must be answered by evidence and
rechecked by the independent Bean seat after every implementation slice. Petra
must return an independent GO/NO-GO before a slice is declared integration-ready.

Roster and test ladder:
`foreman/harvey/HARVEY_RED_TEAM_AND_TEST_LADDER_20260713.md`.

## Allowed mutation boundary

- `app/harvey/**`
- `app/api/harvey/**`
- `lib/harvey/**`
- `next.config.ts` only for the development-only Doss loopback operator-bridge CSP origin; production CSP must remain unchanged
- Harvey-specific `scripts/foreman/**`
- `foreman/harvey/**`
- Harvey-specific `foreman/handoffs/outbox/**` and `foreman/handoffs/inbox/**`
- `foreman/relay/BIRDEYE_FLEET_TOPOLOGY_20260712.json`
- Harvey-specific `data/harvey/**` and `data/tinkerden/**`
- `foreman/gates/APPROVAL_LOG.md`
- `foreman/LANES.md`
- `foreman/BUDGET.md`
- `foreman/NEXT_ACTION.md`

Files inside this boundary are included only when they are required by the
verified Harvey build or receipt contract. The boundary is not a command to
commit every matching file.

## Hard stops

- no unrelated dirty work;
- no secrets or forbidden auth inspection;
- no provider sign-in, OAuth, account mutation, billing, SQL, schema, RLS, or production-data mutation;
- no push, merge, deploy, or public launch without separate explicit approval;
- no cross-machine inference from Doss;
- no persistent remote service or package installation without machine-local authorization;
- no `SENT`-as-success;
- no claim of completion without receiver-side `RECEIVED` plus `COMPLETED` or an exact `BLOCKER` and authoritative readback.

## Required proofs

- Harvey-only file manifest and unrelated-dirty-work exclusion;
- JSON parse;
- TypeScript typecheck;
- production build;
- `/harvey` HTTP 200 and visible truth labels;
- station binding `Inspect` pass;
- local branch commit containing only the approved boundary;
- route-by-route terminal receiver status;
- machine-local Spanzee baseline receipt or exact blocker.
- Sally-local page load plus an automatic visible data update after a Doss-side
  test mutation, without manual refresh;
- independent Bean red-team terminal verdict for each implementation slice.
