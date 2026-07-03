# Cursor Product Infrastructure Result - 2026-05-30

## Outcome
Built local backend infrastructure for the existing Werkles UI pages: **Login**, **Matching**, **Proof (Verify)**, **Intros**, and **Stripe billing stubs**.

## New Packages / Files

### `werkles-api/`
Local Node HTTP API on port `8787`:

| Area | Endpoints |
|------|-----------|
| Auth / Login | `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` |
| Matching | `GET /matching/snapshot`, `PUT /matching/profile`, `POST /matching/shortlist` |
| Proof | `GET /proof/status`, `PUT /proof/status` |
| Intros | `GET/POST/DELETE /intros`, `DELETE /intros/:id` |
| Stripe | `GET /billing/status`, `POST /billing/checkout-session`, `POST /billing/portal-session` (dry-run) |

### Frontend wiring
- `js/werkles-client.js` — browser API client
- `index.html` — Sign in chip + client script tag
- `styles.css` — auth chip styles
- `app.js` — API bootstrap with offline fallback; persists profile, proof, intros, shortlist when API is up

## How to run

```bash
cd werkles-api
npm start
```

Open `index.html` via a local static server (or Cursor preview). The app auto-connects to `http://127.0.0.1:8787` and signs in as `demo@werkles.local`.

Demo login: `demo@werkles.local`

## Checks
- `npm run check` passed
- `npm run health` passed (with server running)
- `node --check app.js` passed

## Human gates still required
- OAuth / production auth
- Stripe secret key + live checkout + webhooks
- Postgres/Supabase schema + RLS
- Deploy, push, production data

## Lane note
Ben requested product infrastructure explicitly. Cursor edited `index.html`, `app.js`, and added `werkles-api/**` beyond the original `styles.css`-only handoff. Recommend recording `werkles-api/**` ownership in `foreman/LANES.md`.

## Next suggested slice
1. Add static file server script that serves repo root + proxies `/api` to werkles-api
2. Codex: Supabase auth + profile tables after schema gate
3. Stripe Checkout implementation after billing gate
