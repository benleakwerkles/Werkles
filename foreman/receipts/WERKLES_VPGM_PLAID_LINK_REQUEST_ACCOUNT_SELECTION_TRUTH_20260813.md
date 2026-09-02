# WERKLES VPGM — PLAID LINK REQUEST + ACCOUNT-SELECTION TRUTH

Date: 2026-08-13
Foreman: Heimerdinker@Betsy
Branch / baseline: `maker/site-g-20260703` / `93b79d1`
Status: LOCAL LINK-HANDOFF SLICE PASS; NAMED CBCC RETURNS PENDING; NO PUSH

## V

Fresh packet:
`foreman/handoffs/outbox/HEIMERDINKER_V_PLAID_LINK_REQUEST_AND_ACCOUNT_SELECTION_TRUTH_20260813.md`

Goal: separate Plaid's display wording from account eligibility and make the
Link-token handoff deterministic without treating a connection as evidence.

## P

Pulled cockpit law/state, prior Crucible receipts, current Link-token route,
provider adapter, Link launcher, Funds card, Plaid documentation context, and
the expected Lady Jessica, Ender/Doozer, Bean, and Thufir/Locke inbox paths.
The named-seat replies remain waiting. Unnamed local workers performed bounded
implementation and attack without impersonating those seats.

## G — deterministic Link request

Added a pure request-config builder that validates and emits only:

- `client_name: "Werkles"` with the Plaid 1–30 character invariant;
- authenticated owner binding in `user.client_user_id`;
- minimal current product `assets`;
- `US` and `en`;
- an optional strict customization name, omitted unless explicitly supplied.

The pure module has no credentials, environment access, network call, or
logging. The server-only provider reads and validates credentials, then adds
`client_id` and `secret` only in the object serialized directly to the Plaid
sandbox request. No account filters are silently imposed.

Files:

- `lib/plaid/link-config.ts`
- `lib/plaid/link-token-request.ts`
- `lib/crucible-providers.ts`
- `scripts/foreman/plaid-link-token-request-smoke.mjs`
- `scripts/foreman/test-crucible-provider-safety.mjs`

## G — account-selection truth

The active Funds card now explains immediately before launch:

- `Financial accounts` is Plaid Link's display term;
- the member chooses from eligible accounts Link shows;
- only selected accounts would be considered;
- completing Link alone creates no funds proof or receipt.

The block appears once, is accessible, and makes no unsupported claim about
checking, savings, investments, filters, or all-account selection.

Files:

- `lib/crucible-account-selection-truth.ts`
- `components/crucible/verification-card.tsx`
- `scripts/foreman/test-crucible-account-selection-truth.mjs`

## Independent attack and repairs

The attack found that Link launch returned immediately after `open()`, clearing
the UI lock while the modal was still active. It now remains single-flight
until Plaid calls success or exit. Invalid local Link configuration is reported
as configuration unavailable (`503`), not a provider failure (`502`).

The Momentum pass then removed two unnecessary secret/token surfaces:

1. credentials were removed from the pure request helper and confined to the
   server-only provider serializer;
2. Plaid's SDK callback still receives its public token, but the Werkles
   launcher discards it at that boundary and exposes only `onSuccess(): void`.

No public token is forwarded, stored, logged, exchanged, or transmitted by the
Werkles client. The exchange route remains disabled.

Files:

- `components/crucible/plaid-link-launcher.ts`
- `components/crucible/crucible-panel.tsx`
- `app/api/verification/funds/route.ts`
- `scripts/foreman/plaid-link-single-flight-smoke.mjs`

## Proof

- Plaid Link-token request contract: PASS.
- Plaid Link single-flight/token-swallow contract: PASS.
- Crucible account-selection truth contract: PASS.
- Crucible card-action contract: PASS.
- Crucible provider-safety contract: PASS.
- TypeScript: PASS.
- Production build: PASS, 84/84 static pages generated.
- Scoped diff check: PASS apart from expected Windows line-ending warnings.
- No provider call, secret output, SQL/schema/RLS action, environment edit,
  staging, commit, push, or deploy.

COMPLETED — local VPGM Link-handoff slice and two-idea Momentum pass.
BLOCKER — actual funds evidence still requires secure Item custody, redesigned
schema/RLS, Balance/Assets policy, named CBCC review, and explicit gates.
