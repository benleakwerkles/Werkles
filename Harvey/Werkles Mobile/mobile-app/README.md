# Harvey Mobile

Harvey Mobile is an Expo React Native command surface for routing Duck payloads into the Werkles bridge network.

The first app slice includes:

- operations dashboard
- Duck intake composer
- route health view
- dispatch history
- shared theme and display components

## Official Location

This source belongs under the canonical Werkles repository:

```text
benleakwerkles/Werkles
Harvey/Werkles Mobile/mobile-app/
```

## Boundary

This source must stay inside the Werkles boundary. See [BOUNDARY.md](./BOUNDARY.md) before doing machine, GitHub, or build-related work.

## Development

Install and validation commands are intended for GitHub Actions or an explicit Werkles-only sandbox:

```text
npm install
npm run lint
npm run typecheck
```

Do not start Expo, simulators, dependency installs, lint, typecheck, or mobile builds on Courtney's machine.

## SSH Onboarding Prototype

The `Access` tab is the first bounded implementation slice from
`../TO_SWANSON_HARVEY_SSH_MACHINE_ONBOARDING_PACKET_v1_20260715.md`.

It creates an in-memory, non-secret request receipt and presents the canonical Ben account,
repository, SSH alias, current proof state, one next move, human gate, and private-key boundary.
The only reachable proof states are `DRAFT` and `CREATED_NOT_DISPATCHED`. Creation is not delivery
or machine execution. The prototype does not generate a key, change GitHub settings, dispatch to a
workstation, or modify a Git remote. Those actions remain blocked until Harvey has an approved
machine-agent bridge and real verification receipts.

The shared mobile theme uses the documented palette v0.2 warm-dark product tokens from
`../../../foreman/DESIGN_SYSTEM.md`: forge-black and workshop-night surfaces, warm-cream text, violet
primary actions, teal secondary actions, forge-orange warnings, and owl-eye-green proven success.

## Handoff

See [HARVEY_MOBILE_HANDOFF.md](./HARVEY_MOBILE_HANDOFF.md) for the current source state and safe validation path.
