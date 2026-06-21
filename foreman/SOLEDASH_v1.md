# SoleDash v1 — Canonical Operator Cockpit

Status: **canonical v1** (Betsy source of truth).  
User-facing operator cockpit. **Not** Speaker. **Not** GimpDash.

## Canonical route

| Surface | URL | Role |
|---------|-----|------|
| **SoleDash** | `http://localhost:3000/soledash` | Operator cockpit — mission, gates, crew, handoffs |
| Foreman | `http://127.0.0.1:4317` | Infra control panel, dispatch, pin shortcuts |
| GimpDash | `http://127.0.0.1:4317/#gimpdash` | GD intent router (preserved plumbing) |
| Speaker | `http://127.0.0.1:4317/#gd-speaker` | Reasoning layer (preserved, separate) |

## Launcher (one canonical)

Repo root: **`soledash.cmd`**

- Portable (`%~dp0`) — same file on Betsy, Doss/BLDER, Sally
- Starts `npm run dev` if localhost is down
- Opens `/soledash`

Desktop pin (optional): Foreman **Pin to Desktop** also writes `Werkles - SoleDash.cmd`.

## Launcher audit (v1)

| Launcher | Path | Opens | Verdict |
|----------|------|-------|---------|
| **SoleDash** | `soledash.cmd` | `localhost:3000/soledash` | **Canonical operator cockpit** |
| Foreman | `foreman-control.cmd` | `:4317` | Infra — keep |
| GimpDash | `gimpdash.cmd` | `:4317/#gimpdash` | GD router — keep, not operator home |
| Aeye Crew | `open-aeye-crew.cmd` | Edge cousin tabs | Dispatch — keep |

**Conflicts resolved:** SoleDash is the single user-facing “what are we doing today” surface. GimpDash and Foreman remain backend/infra; `/gd/command-console` redirects to GimpDash (no duplicate Next cockpit).

## Shared code (no machine forks)

```
app/soledash/           — route + layout + styles
components/soledash/    — UI
lib/soledash/           — reads foreman cockpit files (server-only)
soledash.cmd            — portable launcher
```

Machine identity comes from `foreman/MACHINE_TOPOLOGY.md` + hostname at runtime.

## Sources (read-only v1)

- `foreman/NEXT_ACTION.md` — mission + gate
- `foreman/HUMAN_GATES.md` — human gate doctrine
- `foreman/MACHINE_TOPOLOGY.md` — Betsy / Sally / Doss bind
- `foreman/handoffs/inbox/` · `outbox/` — packets + receipts
- `foreman/AI_COUSINS_PROTOCOL.md` — crew roles
- `foreman/EXECUTION_CONTEXT_RULES.md` — LOCAL HANDS READBACK

Localhost last-success: `foreman/soledash/LAST_LOCALHOST_STATUS.json` (gitignored, written on successful probe).

## Clone to Doss / BLDER / Sally

1. Fetch snapshot branch: `git fetch origin snapshot/sally-good-werkles-2026-06-12`
2. Checkout: `git switch snapshot/sally-good-werkles-2026-06-12`
3. `npm install`
4. Double-click **`soledash.cmd`** (or pin via Foreman)
5. Register machine in `foreman/MACHINE_TOPOLOGY.md` Physical machine registry (Operator row)

No SoleDash code forks per machine. Only topology row + optional desktop shortcut differ.

## v1 limits

- Human gate buttons are labels only (APPROVE / REDIRECT / DEFER)
- Read-only display from local foreman files
- Homepage untouched
