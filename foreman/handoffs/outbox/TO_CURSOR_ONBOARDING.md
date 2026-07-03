# To Cursor: Onboarding Smoke Test

## Status
SUPERSEDED on 2026-05-27.

Do not use this as the current Cursor work packet. Ben approved real parallel local build work for Cursor and Codex.

Current Cursor packet: `foreman/handoffs/outbox/TO_CURSOR_BUILD_NOW.md`

## Role
Cursor / Smart Factory is a new file-writing tool lane. It must not be dropped into the repo cold.

Codex remains Foreman / record keeper until the smoke test passes and Ben reviews the result.

## Start Sequence
1. Read `AGENTS.md`.
2. Read `foreman/ACTIVE_AGENT.md`.
3. Read `foreman/NEXT_ACTION.md`.
4. Read `foreman/LANES.md`.
5. Read `foreman/HUMAN_GATES.md`.
6. Read `foreman/BUDGET.md`.
7. Verify the current git workspace.
8. Create or switch to branch `ben-sandbox`.
9. Perform only the smoke test below.

## Current Gate
None. The former Cursor smoke-test review gate was superseded by Ben's 2026-05-27 parallel-build approval.

Cursor is now approved for real local build work inside the file ownership recorded in `foreman/LANES.md`.

## Branch Rule
- Smoke test branch: `ben-sandbox`.
- Cursor must never commit to `main`.
- Cursor must never push any branch to remote without explicit Ben approval.
- Merge to `main` is always a human gate.
- Push to remote is always a human gate.

## Smoke Test Instructions
Cursor's first task is only:

1. Read `foreman/NEXT_ACTION.md`.
2. Read `foreman/LANES.md`.
3. Read `foreman/HUMAN_GATES.md`.
4. Verify or create/switch to branch `ben-sandbox`.
5. Create `sandbox/cursor-smoke-test/test-a.md`.
6. Create `sandbox/cursor-smoke-test/test-b.md`.
7. Do not touch app files.
8. Do not push.
9. Report whether Cursor prompted per file, once, or not at all.

Suggested file contents:

`sandbox/cursor-smoke-test/test-a.md`

```markdown
# Cursor Smoke Test A

Status: local sandbox smoke test only.
```

`sandbox/cursor-smoke-test/test-b.md`

```markdown
# Cursor Smoke Test B

Status: local sandbox smoke test only.
```

## Hard Stops
Stop immediately if any step requires:

- Login, OAuth, account creation, or account settings.
- Billing, credit card, or paid provider activation.
- Secret entry, secret printing, or secret transport through chat.
- Deploy, push, merge, or release.
- SQL, schema, RLS, or policy changes.
- Production data mutation.
- Editing app implementation files.
- Running Ghost Forge, Bellows, or image generation.
- Any file write outside `sandbox/cursor-smoke-test/`.

## What To Report Back
Report:

1. Branch before the smoke test.
2. Branch after the smoke test.
3. Files created.
4. Whether Cursor prompted per file, once, or not at all.
5. Any files Cursor attempted to touch outside the smoke-test folder.
6. Whether anything was pushed.
7. Any conflicts or uncertainty.

## Real Work Status
SUPERSEDED.

Use `foreman/handoffs/outbox/TO_CURSOR_BUILD_NOW.md`.
