# CBCC review request — Plaid custom Link trust boundary

Date: 2026-08-14

Addressed to: Bean and Thufir/Locke

Return to:

- `foreman/handoffs/inbox/FROM_BEAN_PLAID_CUSTOM_LINK_TRUST_REVIEW_20260814.md`
- `foreman/handoffs/inbox/FROM_THUFIR_LOCKE_PLAID_CUSTOM_LINK_TRUST_REVIEW_20260814.md`

## Review target

Werkles will send the published dashboard customization name `default` in sandbox `/link/token/create` requests.

Please attack:

1. whether customization can be mistaken for provider approval, production readiness, or funds proof;
2. whether a missing/renamed/unpublished customization fails honestly;
3. whether the request or UI exposes owner IDs, credentials, provider tokens, account data, or raw balances;
4. whether Assets consent wording and Werkles copy accurately describe what is shared;
5. whether any current page still launders Link completion into a verification badge;
6. whether public-token exchange remains disabled and no Item is orphaned.

Do not authorize provider, schema, legal, push, or deployment gates.
