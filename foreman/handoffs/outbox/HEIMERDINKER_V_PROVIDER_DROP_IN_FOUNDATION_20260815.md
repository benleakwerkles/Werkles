# Heimerdinker V — Provider Drop-In Foundation

Date: 2026-08-15
Foreman: Heimerdinker / Codex on Betsy
Lane: Werkles.com / Crucible verification infrastructure
Environment: local only

## Vision

Make each external verification or payment provider replaceable at one narrow,
server-only composition boundary. Provider SDKs should plug into reviewed
Werkles contracts instead of teaching the product, UI, or database provider-
specific truth.

The immediate target is infrastructure up to—but not across—the human/provider
gates for Stripe Identity, Plaid, Twilio Verify, and Checkr. Stripe payments may
share readiness/status vocabulary but stays outside verification evidence.

## G Ideas

1. Build an exact provider-neutral adapter contract and registry describing
   capabilities, consent, start/callback/revoke boundaries, environment, and
   narrow outcomes without raw sensitive data.
2. Build fail-closed server composition/readiness tooling that lets a provider
   module be added without leaking secrets or advertising an unavailable check.

## M Ideas

1. Add offline conformance fixtures for Stripe Identity and Plaid plus inert
   Twilio/Checkr placeholders so future adapters have executable acceptance
   criteria before SDK installation.
2. Add concise CBCC handoff packets for UX/trust review and push-custody review.

## Hard Edges

- no provider calls, SDK installation, login, OAuth, account creation, SMS,
  background report, charge, or paid test;
- no secrets or environment values read, printed, changed, or stored;
- no SQL/schema/RLS apply and no production data mutation;
- no push, merge, deploy, public launch, or live feature enablement;
- no provider-specific global verified/safe badge;
- preserve the existing dirty worktree and do not stage unrelated files.

## Stop Condition

Stop at a tested local adapter/composition scaffold and a specific provider or
schema human gate. Return exact files, proofs, and remaining integration seams.
