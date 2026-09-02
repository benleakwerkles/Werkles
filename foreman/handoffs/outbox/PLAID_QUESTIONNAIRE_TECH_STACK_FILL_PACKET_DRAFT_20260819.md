# Plaid questionnaire — technology stack fill packet

Date: 2026-08-19
Status: `DRAFT_FOR_BEN_REVIEW__DO_NOT_CONTINUE`
Foreman: Heimerdinker@Betsy
Source return: `foreman/handoffs/inbox/FROM_COMPUTER_VPGM_20260819-045401.md`

## Proposed field answer

Werkles is a pre-launch web application built with Next.js 15.3.2 (App Router), React 19, TypeScript 5.8, and Tailwind CSS 3.4. Vercel is the intended web hosting/runtime platform, but this packet does not claim a production-live deployment or fixed hosting region.

Supabase Auth is the intended member-identity service, and Supabase Postgres is the intended owner-bound application database. Supabase Storage is planned for future member files. Server-side Intake session continuity is incomplete; provider claim/event/grant tables and Row-Level Security policies are not yet applied; no Storage bucket, adapter, retention contract, or reviewed access policy is connected.

Stripe Billing and Stripe Identity have repository code/test paths but are not asserted production-live. Plaid currently has a sandbox Link-token demo only; public-token exchange, encrypted Item/access-token custody, Assets/Balance evidence, webhooks, revocation, receipts, schema, and RLS are disabled or not connected. Twilio Verify has foundation/contracts only and no connected route, credentials, consent/rate-limit/spend boundary, or persistence. Checkr is policy-blocked and not integrated.

Runtime/provider availability was not inspected for this answer. The current static operator diagnostic marks every provider slot `productionLive: false` and `actionEnabled: false`.

## How to explain the list

- **Vercel:** intended application host/runtime.
- **Supabase:** intended authentication, Postgres application data, and future file storage.
- **Stripe Billing:** future subscription/payment processor; test/code path only.
- **Stripe Identity:** future identity-document verification provider; test/code path only.
- **Plaid:** bank connection provider; sandbox Link-token demo only.
- **Twilio Verify:** planned phone/channel-possession check; not connected.
- **Checkr:** possible future background-screen provider; blocked pending policy/legal workflow.

## Do not infer from this answer

This stack list does not establish hosting/data region, TLS configuration, encryption at rest, key management, access-review cadence, vulnerability scanning, logging/monitoring, backups, retention periods, deletion enforcement, incident-response capability, certifications, or production-live status. Those require separate evidence and questionnaire answers.

## Review/continue gate

Heimerdinker may mechanically place this draft into the technology-stack field after inspecting the live Plaid page. Stop before **Continue**. Ben reviews the visible field and explanation first. Continue/submission remains a human gate.

