# Foreman Control Panel — SoleDash

A small, read-only local console that renders the **Human Gates Console** — clickable cards for APP_INFRA preview routes, repo/PRs, and provider dashboards.

## Run

On the build/relay machine (Sally/Betsy), from the repo root:

```bash
node scripts/foreman/foreman-control-server.mjs
```

Then open: **http://127.0.0.1:4317**

(Port override: `FOREMAN_CONTROL_PORT=4500 node scripts/foreman/foreman-control-server.mjs`.)

## What it shows

Sections: **APP_INFRA Review**, **Repo / PRs**, **Deploy / Hosting**, **Ghost Forge / Render**, **Supabase**, **Stripe**, **Aeye / Crew**.

Each card shows: name, URL or local path, purpose, gate type, status, and an **Open** button when the link is safe to open.

Gate types (color-coded):

- **SAFE LINK** — open / read only.
- **HUMAN GATE** — opening the dashboard is fine, but changing settings / taking the action is a Ben-only gate.
- **BLOCKED** — do not perform from this console.

Links that are not project-exact are tagged **GENERIC LINK**.

## Status Layer (V1)

The console renders a **Status Layer** at the top: crew/task entries with a current state chip and a legend. Visible states: **Received, Thinking, Blocked, Failed, Response Incoming, Complete** ("Thinking" and "Response Incoming" pulse; respects `prefers-reduced-motion`).

- V1 uses a sample feed (`statusItems` in `scripts/foreman/foreman-control-server.mjs`) — UI only; wire to a real source later.
- `GET /status` returns the status model as read-only JSON for future polling.

## SoleDash Inbox / Outbox / Receipts (V1)

The console also renders **SoleDash** — Inbox / Outbox / Receipts — to answer "I sent something; what happened?"

- **Read-only, file-derived** from `foreman/handoffs/outbox/` and `foreman/handoffs/inbox/`. Metadata only (filename, parsed actor, mtime, state) — **packet bodies are never read into the UI**.
- **Outbox** = files in `handoffs/outbox/` (default state `Received`), newest first. **Inbox** = files in `handoffs/inbox/` (default state `Response Incoming`). **Receipts** derive from state (Complete→Delivered, Failed→Failed, else Awaiting).
- States are **V1 defaults** unless set in the optional sidecar (below). Not a live feed.
- **Summary strip:** SoleDash shows counts (Outbox/Inbox totals, receipt buckets, outbox state counts).
- Endpoints (read-only JSON): `GET /outbox`, `GET /inbox`, `GET /receipts`, `GET /summary`.

### Optional status sidecar (read-only)

Create `foreman/handoffs/soledash-status.json` to set real states without routing/automation:

```json
{ "TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.2.md": "Complete", "CODEX_PASTE_BLOCK.txt": "Failed" }
```

Keys are packet filenames; values must be one of the six states. The server **reads** this file (no writes); receipts then reflect it (Complete→Delivered, Failed→Failed, else Awaiting). If the file is absent or invalid, defaults apply.

### Naming note

**SoleDash** is the visible UI name for this command console. **GD** is legacy/internal shorthand only (e.g., internal variable/comment naming). **GimpDash is deprecated** and should not appear in visible UI. All visible surfaces use **SoleDash**.

## Safety (by construction)

- Read-only. The page is static HTML built from a data model in `scripts/foreman/foreman-control-server.mjs`.
- No secrets are read, printed, or stored. No link carries a token.
- No provider API calls. No deploy, push, SQL, or shell exec.
- Clicking a link only opens a dashboard/route in the browser; it never performs the gated action.
- Local folder paths (Outbox/Inbox) are shown as text — no local-open side effects.

## Notes

- APP_INFRA preview routes require the app dev server (`npm run dev`) running on the same machine.
- `/bellows` route and `foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md` are referenced but not yet present; the console labels their status honestly.
- To change the links, edit the `sections` data model in `scripts/foreman/foreman-control-server.mjs`.
