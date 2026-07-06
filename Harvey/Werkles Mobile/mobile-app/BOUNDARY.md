# Harvey Mobile Boundary

This source tree is for the Harvey / Werkles Mobile workload only.

## Official Source

Canonical GitHub repo:

```text
https://github.com/benleakwerkles/Werkles.git
```

Canonical folder:

```text
Harvey/Werkles Mobile/mobile-app/
```

## Machine Ownership

Courtney's game workspace and Courtney's GitHub account remain the default owner of Courtney's physical machine.

Werkles activity must be scoped to the canonical Werkles checkout, a cloud agent sandbox, GitHub Actions, or another explicit Werkles-only sandbox.

## Local Restrictions

Do not do any of the following on Courtney's machine:

- start Expo locally
- start a local dev server
- run a simulator or emulator
- run Android or iOS builds
- install dependencies for this mobile app
- run local package validation that behaves like a build
- modify Courtney's game project to support Werkles
- change global Git or GitHub defaults for Courtney's account

## Allowed Work

Allowed work in this source tree:

- edit source files
- update documentation
- prepare commits
- prepare GitHub handoff material
- configure GitHub Actions with explicit approval
- use repo-local Git identity only

Builds and validation should run in GitHub Actions, Codex cloud agent sandbox, or another explicit Werkles-only environment.
