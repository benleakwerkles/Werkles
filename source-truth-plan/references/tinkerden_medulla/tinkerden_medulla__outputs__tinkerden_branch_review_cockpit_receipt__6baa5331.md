# TinkerDen Branch Review Cockpit Receipt

Generated: 2026-06-22

## URL

`http://10.1.10.8:18080/tinkerden_branch_review_cockpit.html`

## File

`C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\tinkerden_branch_review_cockpit.html`

## Screenshot

`C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\tinkerden_branch_review_cockpit.png`

## Source Inputs

- `outputs\betsy_branch_review_cockpit_receipt.md`
- `outputs\branch_preview_decision_layer.md`
- `outputs\branch_preview_index.md`
- `outputs\tinkerden_working_preview_receipt.md`
- `outputs\live_preview_health_screenshots\*.png`

## Built Sections

1. Mission Control - WHY
2. Bridge - NOW / Top 3 Moves
3. Engine Room - EXECUTION / packets / receipts
4. Human Gates - packaged decisions
5. Branch Vulture Review - keep/kill/steal

## Clickable Items

- Open TinkerDen Preview
- Why These Pieces
- Decision Layer
- Betsy Review Receipt
- Health Receipt
- Human Gate Packet links
- Open Packet buttons
- Open Preview buttons on each branch card
- Explanation buttons on each branch card
- KEEP / KILL / STEAL local mark buttons
- KEEP / KILL / STEAL note fields

## Static / Fake Items

- KEEP / KILL / STEAL buttons write browser-local receipts only.
- Notes persist through browser `localStorage`, not a repo file.
- Human Gate packets are review stubs, not active approvals.
- Receipt slots are local UI state until a file-backed receiver is added.

## Verification

- Cockpit URL returned HTTP 200.
- Human Gate packet links returned HTTP 200.
- Browser check confirmed Mission Control, Bridge, Engine Room, Branch Vulture Review, packet links, and 12 screenshot cards.
- Browser check confirmed all screenshot images loaded.
- Browser click check confirmed KEEP on Goop Cycle creates a visible local receipt.
- Desktop screenshot captured at `outputs\tinkerden_branch_review_cockpit.png`.

## Safety

- No merge.
- No delete.
- No worktree cleanup.
- Ports and hashes are not primary labels.
