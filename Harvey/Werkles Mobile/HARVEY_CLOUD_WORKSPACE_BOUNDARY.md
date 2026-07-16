# Harvey Cloud Workspace Boundary

Status: ACTIVE
Updated: 2026-07-15
Owner: Ben / benleakwerkles
Execution owner: Dink @ Medullina

## Source of truth

~~~text
Repository: https://github.com/benleakwerkles/Werkles
Cloud branch: codex/cloud-harvey-mobile-vpg-20260715
Harvey folder: Harvey/Werkles Mobile/
Local source checkout: NONE
~~~

The GitHub folder above is Harvey Mobile's working source. The empty Werkles Reboot directory is only a Codex task container. It is not source truth and must not receive a repo clone, generated source, build output, packet copy, or private key.

## Owner boundary

### Ben / Werkles

- GitHub owner: benleakwerkles
- Repository: benleakwerkles/Werkles
- Codex anchor title: BEN — Harvey Mobile Cloud
- Machine-readiness reference: BEN — Werkles Machine Readiness
- Source reads and writes occur through GitHub cloud surfaces.

### Courtney / Game

- Project folder: Courtney Game
- Courtney's source and GitHub identity are outside Harvey scope.
- Do not start, store, build, test, or validate Harvey code inside Courtney Game.
- Do not rename, archive, or modify a Courtney game task merely because it appears beside a Ben task.

## Allowed cloud surfaces

- Ben's GitHub repository and branches
- GitHub web editor under the canonical Harvey folder
- GitHub Actions or an explicitly approved cloud sandbox
- Codex task metadata for naming, pinning, and reversible archiving

## Forbidden local actions

- no Harvey source checkout
- no Expo or simulator startup
- no dependency install
- no local lint, typecheck, package, or build
- no SSH private key storage
- no packet copies outside GitHub
- no use of Courtney Game as a fallback workspace

## Task placement

1. Start Harvey work from the pinned BEN — Harvey Mobile Cloud task.
2. Prefix surviving Ben task titles with BEN —.
3. Archive superseded Harvey tasks; do not delete them.
4. Keep machine or account maintenance in a separate MACHINE or ADMIN task.
5. When Codex exposes a GitHub-backed remote Project, reopen Harvey work there and retire the empty local task container.

## Packet preflight

Every future Harvey packet must state:

~~~text
OWNER: Ben
PROJECT: Harvey Mobile
REPOSITORY: benleakwerkles/Werkles
FOLDER: Harvey/Werkles Mobile/
CLOUD_ONLY: true
LOCAL_SOURCE_CHECKOUT: none
BRANCH:
PROOF_BOUNDARY:
HUMAN_GATES:
~~~

## Proof rule

Created is not dispatched. Queued or sent is not delivered. Completion requires receiver proof and a returned completion or blocker receipt. A GitHub commit proves only that content exists at that commit; it does not prove merge, deployment, runtime health, or live Flock health.

## Human gates

- merge to main
- deployment or public release
- GitHub account, key, or permission changes
- deletion of task history
- creation of any local Harvey source checkout
