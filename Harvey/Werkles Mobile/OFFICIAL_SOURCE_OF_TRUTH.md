# Harvey / Werkles Mobile Source Of Truth

This folder is the official source-of-truth area for Harvey / Werkles Mobile inside `benleakwerkles/Werkles`.

## Official Location

```text
https://github.com/benleakwerkles/Werkles.git
Harvey/Werkles Mobile/
```

## Mobile App Source

```text
Harvey/Werkles Mobile/mobile-app/
```

The current `mobile-app/` import is an Expo React Native scaffold for Harvey's Werkles Mobile command surface.

## Boundary

- Do not use Courtney's game workspace for Werkles Mobile work.
- Do not commit credentials, tokens, secrets, account data, local environment files, or private customer data.
- Do not run local mobile builds, Expo servers, simulators, dependency installs, lint, or typecheck on Courtney's machine.
- Run validation in GitHub Actions, Codex cloud/sandbox, or another explicit Werkles-only sandbox.

## First Next Steps

1. Review `mobile-app/HARVEY_MOBILE_HANDOFF.md`.
2. Decide whether the first production path is native app, mobile web/PWA, or companion interface.
3. Add repo issues or tasks for the first mobile backlog.
4. Add or approve top-level GitHub Actions checks for the mobile app.
