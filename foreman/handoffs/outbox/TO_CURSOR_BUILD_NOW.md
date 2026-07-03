# To Cursor: Build Now

## Status
Ben approved Cursor and Codex to stop waiting on the smoke-test review and start real local build work in parallel.

Do not ask Ben routine confirmation questions. Proceed until you hit a real human gate.

## Read First
1. `AGENTS.md`
2. `foreman/ACTIVE_AGENT.md`
3. `foreman/NEXT_ACTION.md`
4. `foreman/LANES.md`
5. `foreman/HUMAN_GATES.md`
6. `foreman/BUDGET.md`

## Your First Build Slice
Improve the visual and interaction polish for the existing Werkles static prototype after Codex wires functional Matches / Intros / Verify views.

## File Ownership
You own:

- `styles.css`
- optional new notes under `sandbox/cursor-build-notes/`

Avoid:

- `index.html`
- `app.js`
- app data/model changes
- deploy, push, merge, paid calls, secrets, SQL, production data, Ghost Forge, Bellows, image generation

## Product Direction
Make the working app feel like a serious operating surface for local-business partner matching:

- compact, readable, not a marketing page
- clear active nav/view state
- stronger empty states and queued-intro states
- polished responsive behavior
- no oversized hero treatment
- no decorative gradient/orb background

## Report Back
Create a result handoff under `foreman/handoffs/` with:

- files changed
- what you improved
- checks performed
- any actual human gate encountered
- next suggested local build slice
