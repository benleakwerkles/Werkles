# Werkles Source-Bound Release Candidate Evidence — 2026-08-23

Status: `LOCAL_CANDIDATE_ONLY__GATE_05_CLOSED`

This packet binds the current local M8 trust slice to source and executable
evidence. It is not a release approval and does not authorize a push, deploy,
promotion, provider activation, or production mutation.

## Production baseline

- Branch: `maker/site-g-20260703`
- Local HEAD and remote branch: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`
- Last proven live product update: the August 2, 2026 `93b79d1` Membership
  slice, visible in production by approximately 6:00:54 PM EDT.
- Newest explicit production deployment receipt in the repository: Lady
  Jessica, July 31, 2026, `dpl_GZFsTqBD9siW2J8oD4MqoPrviFhA`.
- M2–M8 Broad Rotation work is local and is not represented as live.

## Candidate boundary

The shared readout now explicitly says the practice Werkle is browser-local,
on this device, and not an account-saved record. It separately names accepted
input, excluded private material, restore behavior, non-agreement status, and
inactive providers. Formation always shows it; Personal Bellows shows it only
after the strict stored-Brief parser accepts a device Brief.

Petra returned custody-valid verdict `PATCH` under
`CUSTODY-PETRA-BB1EE239619CE2A318E379BEC8C74FBB`. Her locality correction is
assimilated. Her receipt remains bounded local review, not production custody.

## Source evidence

```text
components/werkle/practice-boundary-readout.tsx|1281|2878f2f457c9454b3b568acdba2bf977cdebed3efa5fa3b6224c10d0e85a1096
components/werkle/formation-workbench.tsx|37776|8e7534cd34cf82d6c2f50826f676a912afe4b72932399e39bd972334f0cd140e
components/bellows/bellows-device-draft-shelf.tsx|8556|dc7a15501b28b0d2c67b6b1ac1facdf27ac2f80e35ff2645f9e9a60dbd858e5b
app/globals.css|335871|6c7b2c70aa3b4b10f8b7fa809d1f632c21a9dc0d2968bbe76a879d866b63a9b4
scripts/foreman/practice-boundary-readout-smoke.mjs|1652|bc815fcf5eee3814570fd156e71024f16c1c8238f73c0b05c76f2d6d2099c9ac
scripts/foreman/broad-rotation-m8-practice-boundary-browser-smoke.mjs|4832|9755f43a9736e608e580ce88de4f2552f051156767365bd9bb96f9515f25b0c8
foreman/releases/WERKLES_LIVE_LOCAL_DELTA_20260823.md|2788|c3aab24590fcd9180743a9182220aca0fa25416ddd93f09864a7849f221391db
foreman/handoffs/inbox/FROM_PETRA_WERKLES_BROAD_ROTATION_M8_v0.1.md|1097|f047d184a89c49353c2b4f780f28f3103d7b485f84ea2150f12cc7eaed8916a3
```

The shared worktree contains unrelated and prior local work; the dirty tree is
not represented as a clean release candidate or as solely M8-owned.

## Executable evidence

- `npx tsc --noEmit` — PASS
- `node scripts/foreman/practice-boundary-readout-smoke.mjs` — PASS
- `node scripts/foreman/broad-rotation-m8-practice-boundary-browser-smoke.mjs` — PASS
- `node scripts/foreman/broad-rotation-m7-operating-brief-browser-smoke.mjs` — PASS
- Local Formation — HTTP 200
- Local Personal Bellows — HTTP 200
- Live Membership — HTTP 200

The browser proof covers conditional Bellows visibility, exact locality and
provider language, 16px desktop/mobile text, 390px overflow, clean console,
Formation-to-Brief return, and stale Brief/action invalidation.

## Closed release gate

Gate 05 stays closed until the existing three-key custody process is satisfied:
Heimerdinker prepares and proves the candidate, Lady Jessica independently
reviews and executes the release, and Ben authorizes the production action.
This packet supplies evidence for that later decision; it does not make it.
