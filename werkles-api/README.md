# Werkles API

Local backend infrastructure for the Werkles prototype pages:

| Module | Routes | Status |
|--------|--------|--------|
| **Login / Auth** | `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` | Dry-run session tokens |
| **Matching** | `GET /matching/snapshot`, `PUT /matching/profile`, `POST /matching/shortlist` | Ports scoring from the UI |
| **Proof** | `GET /proof/status`, `PUT /proof/status` | Verification checklist persistence |
| **Intros** | `GET/POST/DELETE /intros` | Intro queue persistence |
| **Stripe / Billing** | `GET /billing/status`, `POST /billing/checkout-session` | Stub only until Stripe gate |

## Start

```bash
cd werkles-api
npm start
```

Default: `http://127.0.0.1:8787`

Demo login email: `demo@werkles.local`

## Browser client

Load `js/werkles-client.js` before `app.js`. The UI auto-connects when the API is reachable.

## Environment

Copy `.env.example` to `.env`. No secrets required for local dry-run.

## Human gates still required

- OAuth / production auth provider
- Stripe secret key + live checkout
- Supabase/Postgres schema
- Deploy, push, production data
