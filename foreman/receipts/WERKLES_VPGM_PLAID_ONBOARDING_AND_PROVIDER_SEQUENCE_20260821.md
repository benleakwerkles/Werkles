# Werkles VPGM receipt — Plaid onboarding and provider sequence

Date: 2026-08-21
Foreman: Heimerdinker@Betsy

## Live Plaid state

- Claimed the existing authenticated Plaid dashboard tab at `/onboarding/business-type`.
- Read-only inspection found the first required step:
  - registered business address;
  - city, state, ZIP;
  - legal business type matching company registration.
- Available business types: Sole Proprietorship, Limited liability company, Private Company, Public Company (Unlisted), Public Company (Listed), Charitable organization / Not-for-profit, Partnership, Other.
- The canonical repository does not contain a verified registered address or trustworthy entity-type proof. Historical files conflict by calling Werkles “Werkles, Inc.” while other crew records describe the business as pre-launch/informal.
- No field was filled, no button was submitted, no production key was created or revealed, and no Plaid setting changed.
- The tab is preserved at the business-verification step for Operator readback.

## CBCC pull

- Applied Petra's valid personal `PATCH_BEFORE_STAGE` Plaid scope ruling: intended controls cannot be represented as operational facts; exact evidence and legal/policy artifacts must precede submission.
- Bean and Thufir questionnaire payloads found in quarantine were not promoted into approved receipts.
- Existing operator data-minimization direction was preserved.

## Corrected Plaid use case

- Added `foreman/plaid/PLAID_PRODUCTION_ONBOARDING_BRIEF_V1.md`.
- Marked the July persistent-Item V0 package `SUPERSEDED — DO NOT SEND`.
- Current use case: match people on goals, interests, temperament, abilities, and boundaries first. The ordinary member signal is only `Funds verified · [date]`, never an amount, threshold, band, or wealth rank. A specific minimum can be checked only in a separate private one-to-one exchange after both named members consent, using a fresh paid check. Werkles retains no raw balances, transactions, account numbers, credentials, or reports and removes the Item/report from Werkles access after evaluation. Plaid's independent retention remains governed by Plaid's own terms and legal duties.

## Provider sequence

Added `foreman/integrations/WERKLES_PROVIDER_SEQUENCE_20260821.md`:

1. Plaid production onboarding and product-fit confirmation.
2. Stripe Billing, then Stripe Identity.
3. Supabase Auth and owner-bound Postgres custody.
4. Twilio Verify.
5. Supabase Storage.
6. Transactional email provider — not yet selected.
7. Observability and abuse protection — not yet selected.
8. Checkr — policy/legal blocked.

Vercel and 1Password remain operational infrastructure/custody rather than member-facing proof providers.

## Product repair

- Crucible's data-boundary disclosure formerly said `What happens to the data`, which could imply live behavior.
- It now says `Not live yet: what would happen to the data`.

## Proof

- Plaid public-signal/private-disclosure privacy contract: PASS.
- Active member-facing copy scan removed the remaining `liquidity band` language.
- Fictional private funds-check receipt requires bilateral consent in its disclosure: PASS.
- Eight-service data-minimization boundary contract: PASS.
- Tech-stack slot catalog: PASS.
- Crucible member tech-stack journey: PASS.
- Operator tech-stack diagnostics: PASS.
- TypeScript: PASS.

## Hard gate

Before Plaid can receive step-one data, the Operator must provide the exact registered business address and the legal entity type shown in company registration, then approve transmitting those specific company details to Plaid.
