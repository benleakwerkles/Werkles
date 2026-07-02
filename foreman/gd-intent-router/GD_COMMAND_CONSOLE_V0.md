# GD Command Console / GimpDash

Status: **INTEGRATED — one console only**

## Where to open

**GimpDash** on the Foreman Control Panel:

- **http://127.0.0.1:4317/#gimpdash**
- Or run `gimpdash.cmd` from repo root

The separate Next route `/gd/command-console` **redirects** to GimpDash. Do not use two surfaces.

## How it works

1. Ben states **what he wants to do** (plain language).
2. **Route intent** — GD governor classifies topic and auto-routes crew by role.
3. No crew picker. No paste-from-cousin workflow.
4. Thread refresh, mission classes, and runs live in the same GimpDash panel.

## Governor source

| File | Role |
|------|------|
| `foreman/gd-intent-router/gd-command-governor.mjs` | Classifier + verdict (source of truth for Foreman) |
| `lib/gd-command-console.ts` | Same logic for Next/tooling (keep in sync) |
| `scripts/foreman/foreman-control-server.mjs` | GimpDash UI + `POST /api/gd/route-intent` |

## Hard stops

Production deploy, push to main, SQL/schema, secrets, Stripe live, auth edits, provider spend — negated phrasing (e.g. "no deploy") is ignored.
