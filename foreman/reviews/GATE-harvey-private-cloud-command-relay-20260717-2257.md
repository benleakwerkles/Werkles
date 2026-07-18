# Gate — Private Harvey Cloud Command Relay

Status: `AWAITING BEN APPROVAL`

Confidence: `HIGH`

Confidence basis: the application passes TypeScript and a production build; the private-access route passes an isolated end-to-end login/origin test; the relay contract passes three regression tests; and the complete SQL migration passed a transactional test on the Werkles Supabase Postgres engine before being rolled back. A readback then proved that zero Harvey relay tables remained in production. An independent hands-capable Dink review first returned `PATCH`; after the identity, routing, state-truth, and test corrections, its read-only follow-up returned `GO` with no remaining findings.

## Decision

Approve or reject activation of the private Harvey command relay at `https://werkles.com/harvey`.

Activation is one bounded production change:

1. apply the reviewed Supabase schema/RLS migration;
2. commit and push only this clean branch's relay files;
3. deploy this branch to the existing private Werkles production site;
4. send one non-secret `VERIFY` command to `All Aeyes` and return its database and browser evidence;
5. run Supabase security/performance advisors and a live private-access/send smoke test.

## What changes for Ben

The main Harvey `SEND` button stops treating every non-local browser as view-only. A valid private Harvey session may submit a same-origin command. `All Aeyes` creates one command and 21 named Harvey inbox deliveries: 20 Aeyes from the monitor wall plus the proven Shakespeare task identity.

Harvey will display distinct truth states:

- inbox delivery (`QUEUED`);
- receiver pickup (`CLAIMED`);
- active work/reply (`WORKING` / `REPLIED`);
- terminal receiver receipt (`COMPLETED` / `BLOCKED`).

Inbox delivery is not described as Aeye receipt or completion.

## Unknowns

- Most Aeyes still lack a continuously running cloud courier or exact provider-task binding. Their first commands will remain visibly queued until those receiver routes are installed.
- Only Shakespeare@Doss currently has an exact recorded provider task identity; even that task still needs the next Doss cloud-courier binding before automatic pickup.
- The provider deployment may expose an unrelated pre-existing build/configuration problem not reproduced by the successful local production build.

## Blast radius

- Existing private route: `/harvey`.
- Existing API route: `/api/harvey/work-orders`.
- Six new private Supabase tables. Only enqueue is service-role callable; the two prepared receiver functions are explicitly locked until a signed receiver adapter passes a separate review.
- No existing table is altered.
- No password, token, recovery code, or 1Password content is read or stored.
- Command text becomes durable production data. The UI explicitly prohibits secrets.

## Files changed

- `app/api/harvey/work-orders/route.ts`
- `app/harvey/HarveyCommandDeck.tsx`
- `app/harvey/operator-bridge.ts`
- `lib/harvey/cloud-relay.ts`
- `lib/harvey/work-orders.ts`
- `scripts/foreman/harvey-tests/cloud-relay-contract.test.mjs`
- `scripts/foreman/harvey-tests/private-access.e2e.mjs`
- `supabase/migrations/20260718024422_harvey_cloud_relay.sql`
- `supabase/tests/harvey_cloud_relay.sql`
- `foreman/reviews/RED_TEAM-harvey-private-cloud-command-relay-20260717.md`
- this review pair

## Systems affected

- Werkles Next.js production deployment on Vercel
- Werkles.com Harvey private page
- Werkles Supabase Postgres project `ltixqticdtvztjcqmtjn`
- GitHub branch `codex/harvey-cloud-relay-20260717`

## Budget / spend

No new paid provider, model, project, branch, or subscription is created. The change uses the existing Vercel deployment and existing Supabase project. Normal storage/function usage may increase with command volume.

## Lane and stop condition

Current work is local and review-only. SQL apply, RLS activation, push, production deploy, and the single production test command remain blocked until Ben approves this gate. Stop after the first live receipt/status proof or on any schema, auth, secret, billing, or deployment discrepancy.

## Known risks and mitigations

- **Command spam / duplicates:** 32-hex submission IDs are idempotent; reusing an ID with changed body or recipients is rejected.
- **Concurrent receiver collision:** claims use row locks with `SKIP LOCKED` and bounded leases.
- **Receiver impersonation:** receiver identity is bound to one canonical machine and an explicit recipient allowlist in the database; claim/receipt execution is withheld from the deployed service role in this slice.
- **False completion:** only a receiver receipt can set terminal status.
- **Browser forgery:** private session plus strict same-origin POST gate.
- **Database exposure:** RLS enabled; all grants revoked from public, anon, and authenticated; only service role may access tables/functions.
- **Secret leakage:** server-only module boundary; UI warning and existing secret-shape rejection.
- **Unrelated dirty work:** implementation lives in a clean worktree and branch; the canonical dirty checkout is untouched.

## What remains blocked after approval

Automatic execution by every named Aeye. This gate creates a real private command bus and durable inboxes; the receiver contracts remain database-locked. Per-machine couriers and exact app/task adapters are the next build slice and will be proven individually before receiver execution is granted.

## Phrases

- Approve: `APPROVE PRIVATE HARVEY CLOUD COMMAND RELAY`
- Reject: `REJECT PRIVATE HARVEY CLOUD COMMAND RELAY`
- Patch: `PATCH PRIVATE HARVEY CLOUD COMMAND RELAY: <change>`
