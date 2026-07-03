# Werkles Repo Consolidation Receipt - 2026-07-02

## Canonical repo state

- Canonical checkout inspected: `C:\Users\Ben Leak\Desktop\github\Werkles`
- Intended canonical folder name: `werkles`
- Current on-disk folder case: `Werkles`
- Case-only rename status: blocked by a live Cursor-launched `next dev -p 3047` process tree repeatedly respawning or holding `C:\Users\Ben Leak\Desktop\github\Werkles`
- Active branch: `consolidation/werkles-unified-20260702`
- Merge HEAD before receipt: `3ab866fe73c8d9eb083391921a27af3a2bccaf56`
- Remote origin: `https://github.com/benleakwerkles/werkles.git`
- Git status after consolidation: clean

## Merged lanes

- `2ce1bd5` - merged Swanson and Maker Werkles lane from `C:\Users\Ben Leak\Documents\Codex\2026-06-28\count-gimpula-real-aeye-relay-proof\work\werkles-main-swanson-merge-20260628204120`
- `1f0dd15` - merged detached Wonka Den visual compare lane from `C:\Users\Ben Leak\Desktop\github\Werkles-visual-compare-20260621\cursor-goop-cycle-pvp-9b25`
- `d846b70` - preserved and merged the dirty Desktop overlay from `C:\Users\Ben Leak\Desktop\github\Werkles`
- `3ab866f` - final merge commit for the Desktop overlay into the unified lane
- Current branch tip includes this consolidation receipt; use `git log -1` for the exact containing commit.

Ancestor checks passed for:

- `d846b70` Desktop dirty overlay
- `2ed3902` Wonka visual compare
- `2b7210e` Swanson/Maker intake
- `8e70a25` visual salvage
- `ffccad0` visual snapshot

## Retired or archived paths

- Removed Git worktree registrations so only the Desktop checkout remains registered.
- Physically removed retired worktree folders:
  - `C:\Users\Ben Leak\Desktop\github\Werkles-visual-compare-20260621`
  - `C:\Users\Ben Leak\Documents\Codex\2026-06-28\count-gimpula-real-aeye-relay-proof\work\werkles-main-swanson-merge-20260628204120`
  - `C:\Users\Ben Leak\Documents\Codex\2026-07-02\execute-the-dink-masheen-werkles-local\work\werkles-unified-staging-20260702`
- Archived old clean duplicate clone:
  - From: `C:\Users\Ben Leak\github\Werkles`
  - To: `C:\Users\Ben Leak\github\_archive\Werkles-old-main-20260702`
  - Archived HEAD: `0c727a2`

## Loose file archive

Untracked temp/status files were archived before cleanup:

- `C:\Users\Ben Leak\Documents\Codex\2026-07-02\execute-the-dink-masheen-werkles-local\outputs\werkles-stray-20260702`
- Manifest line count: 27

## Verification

- `git status --short --branch` returned clean on `consolidation/werkles-unified-20260702`.
- `git remote -v` returned `https://github.com/benleakwerkles/werkles.git` for fetch and push.
- `git worktree list --porcelain` returned only the Desktop checkout.
- JSONL conflict resolutions were parsed successfully for:
  - `data/organism/events.jsonl`
  - `data/organism/receipt_pickup.jsonl`
  - `tinkarden/membrane/swanson_functional_relays.jsonl`

## Remaining manual unblock

The only unfinished part is the physical case-only folder rename from `Werkles` to `werkles`. Git state and remote state are already correct. The rename should be retried after closing Cursor or stopping the Cursor-launched `PowerShell -> npx -> cmd -> next dev -p 3047` process tree holding `C:\Users\Ben Leak\Desktop\github\Werkles`.
