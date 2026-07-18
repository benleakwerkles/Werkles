# Gate - Private Harvey Speaking VPG Loop

Status: `READY FOR BEN'S PRODUCTION DECISION`

Confidence: `HIGH FOR LOCAL, TRANSACTIONAL, AND INDEPENDENT REVIEW PROOF`

## Decision

Harvey is no longer proposed as an inbox-only command bus. This revision gives one exact, allowlisted Shakespeare@Doss Codex task a signed receiver route and returns its reply to the private Harvey conversation.

Production remains unchanged until Ben gives this exact phrase:

```text
APPROVE PRIVATE HARVEY SPEAKING VPG LOOP
```

That phrase authorizes one bounded activation:

1. apply the reviewed Supabase schema/RLS migration;
2. configure the matching production receiver audience and stable Doss courier secret without printing either secret;
3. push only the clean `codex/harvey-cloud-relay-20260717` branch and deploy it to the existing private Werkles production site;
4. start the signed Doss courier from the exact clean, provider-bound checkout;
5. send one non-secret `VERIFY` command and prove `QUEUED -> CLAIMED -> WORKING -> REPLIED -> COMPLETED` in Harvey;
6. run Supabase security/performance advisors and the live private-access/send smoke test;
7. stop on any schema, auth, secret, billing, deployment, or conversation-proof discrepancy.

## What changes for Ben

- The private Harvey `SEND` control submits a same-origin cloud command from Sally or another authenticated browser.
- `All Aeyes` creates one command and 21 named inbox deliveries.
- Shakespeare@Doss has the first proved speaking route.
- The other 20 deliveries remain explicitly `AWAITING_RECEIVER`; Harvey does not call them received.
- Harvey displays the command, receiver progress, reply, blocker, and terminal receipt as a conversation.

## Truth states

- `QUEUED`: delivered to the Harvey inbox only.
- `CLAIMED`: the signed receiver picked it up.
- `WORKING`: the exact task accepted and began the dispatch.
- `REPLIED`: the exact task returned a bounded reply.
- `COMPLETED` or `BLOCKED`: terminal receiver receipt.

`QUEUED` is not `RECEIVED`. `CLAIMED` is not `COMPLETED`.

## Proof completed

- TypeScript: PASS.
- Fresh Next.js production build: PASS; `/harvey`, `/api/harvey/relay/claim`, and `/api/harvey/relay/receipt` are present.
- Relay/security contracts: 5/5 PASS.
- Signed Doss courier mock conversation: 1/1 PASS, including `WORKING -> REPLIED -> COMPLETED`.
- Both PowerShell scripts parse.
- Updated migration and behavioral SQL: PASS inside `BEGIN/ROLLBACK` on the actual Werkles Supabase Postgres project.
- Production post-rollback readback: zero Harvey relay tables.
- Independent reviewer task `019f0fb9-c2b8-7fd0-99d6-1ac67a52edb7`: terminal `GO`, no remaining findings.

The reviewer did not run tests; test claims belong to the executing Swanson lane.

## Red-team corrections incorporated

- Database-bound receiver, canonical machine, and exact recipient route.
- One-use audience-bound HMAC nonces with a per-receiver capacity limit.
- Rotating claim tokens and stale-worker rejection.
- Expired `CLAIMED`, `WORKING`, and `REPLIED` delivery reclaim.
- Service-role functions constrained by receiver, route, lease, and current claim token.
- Exact allowlisted provider task binding and bounded reply payload.
- Doss runtime limited to a clean, provider-bound checkout.
- Doss local control plane bound to `127.0.0.1`; no LAN URL or unauthenticated LAN work-order surface.

## Blast radius

- Existing private route: `/harvey`.
- Existing work-order route plus two signed receiver routes.
- Seven isolated Supabase tables; no existing table is altered.
- One Doss courier for one exact Codex task.
- Existing Vercel project and Supabase project only.
- Command text becomes durable production data. Passwords, tokens, codes, recovery keys, and other secrets are prohibited.
- No unrelated dirty work is included.

## What remains after this activation

This activation proves one real speaking Aeye route. It does not silently make the other 20 Aeyes live. Their per-machine couriers and exact provider-task adapters remain separate, independently proved slices.

See `RED_TEAM-harvey-private-cloud-speaking-vpg-20260718.md` for the expanded independent review receipt.
