# Exact-Source Review — Crucible Provider Access + Practice Separation

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
To: Thufir, Petra, Bean, Doozer  
Response requested: exact file/line findings and verdict `GO`, `PATCH`, or `REJECT`; no silent approval

## Review set

- `app/dashboard/crucible/page.tsx`
- `components/crucible/crucible-panel.tsx`
- `components/crucible/verification-card.tsx`
- `components/crucible/ghost-provider-walkthrough.tsx`
- `components/crucible/tech-stack-journey.tsx`
- `lib/crucible.ts`
- `lib/crucible-card-action.ts`
- `lib/crucible-provider-readiness.ts`
- `lib/copy.ts`
- `scripts/foreman/crucible-signed-member-provider-access-smoke.mjs`
- `scripts/foreman/crucible-signed-member-provider-access-browser-smoke.mjs`

## Questions

1. Does Ghost practice remain synthetic without globally disabling a connected member's guarded provider actions?
2. Does local/dev preview fail honestly at `connected test account required` instead of falsely saying sign in?
3. Are the existing auth, membership, runtime, adapter, sandbox, custody, and legal gates still intact?
4. Was repeated/internal copy removed without weakening proof limitations?
5. Is the page still usable at 390px with all eight stack services and provider cards?

## Local proof

- local member sees synthetic practice + connected-account gate — PASS
- Ghost Fleet no longer sets global provider read-only — PASS
- one narrow-proof principle, no duplicated principle — PASS
- internal draft/placeholder/walkthrough-only copy absent — PASS
- four stages, eight services, current provider states — PASS
- Plaid, Stripe Identity, Twilio, factory acceptance, composition-root regressions — PASS
- 59 UI links + 8 model links + 17 destinations, 0 route findings — PASS
- 390px containment and browser console/page errors — PASS / none
- TypeScript — PASS

## Hard edges

No live provider execution, production token, payment, schema, secret, policy approval, background-check activation, commit, push, or deploy.

Return an actual receipt to `foreman/handoffs/inbox/` naming this packet. The outgoing packet is not participation.
