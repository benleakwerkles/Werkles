# Harvey Mobile Handoff

Prepared for the official Werkles repository import on 2026-07-06.

## Official Repo State

- Canonical repo: `https://github.com/benleakwerkles/Werkles.git`
- Canonical folder: `Harvey/Werkles Mobile/mobile-app/`
- Default branch: `main`
- Existing official parent folder: `Harvey/Werkles Mobile/`

## App Slice

The source contains an Expo React Native scaffold for Harvey Mobile:

- operations dashboard
- Duck intake composer
- route health view
- dispatch history
- shared theme and display components

## Boundary Maintained

The following were not run on Courtney's machine for this handoff:

- Expo local server
- mobile simulator or emulator
- Android or iOS build
- dependency install
- local lint
- local TypeScript check
- any validation that behaves like a build

The following machine-wide settings were not changed:

- global Git author settings
- global GitHub authentication
- Courtney's game workspace
- Courtney's GitHub defaults

## Validation Path

Validation should happen only after import, in GitHub Actions, Codex cloud agent sandbox, or another explicit Werkles-only sandbox.

Expected checks:

```text
npm install
npm run lint
npm run typecheck
```

If checks fail, fix source files in the canonical Werkles checkout or a Werkles-only sandbox. Do not make Courtney's local game environment responsible for Werkles setup.

## Next Steps

1. Apply the import patch from the canonical checkout.
2. Commit the import on a branch or directly to `main`, depending on the repo's normal workflow.
3. Add or approve GitHub Actions checks for the mobile app.
4. Let validation run remotely.
