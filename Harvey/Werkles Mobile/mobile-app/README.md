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

## Handoff

See [HARVEY_MOBILE_HANDOFF.md](./HARVEY_MOBILE_HANDOFF.md) for the current source state and safe validation path.
