# HEIMERDINKER V — PLAID LINK REQUEST + ACCOUNT-SELECTION TRUTH

Date: 2026-08-13
Foreman: Heimerdinker@Betsy
Status: LOCAL DRAFT BUILD; NO PROVIDER, SQL, PUSH, OR PRODUCTION ACTION

## Vision

Make the Plaid Link handoff explicit and understandable before Werkles stores
or evaluates any financial evidence. Separate display wording from account
eligibility and prevent a Link connection from being mistaken for proof.

## G ideas

1. **Deterministic Link request contract:** extract a pure sandbox Link-token
   request builder with the recognized client name, minimal products, country,
   language, owner binding, and optional customization name. Validate all
   display/configuration strings and test the serialized request without a
   provider call.
2. **Account-selection truth in Crucible:** explain immediately before launch
   that `financial accounts` is display wording, the user chooses eligible
   accounts inside Plaid, and opening/completing Link does not itself create a
   funds proof. Keep it concise and accessible.

## Crew division

- Worker A: pure Link request builder and offline contract.
- Worker B: compact member-facing account-selection explanation and UI test.
- Worker C: independent attack for overcollection, account-type ambiguity,
  customization drift, fake proof, and duplicate/unsafe launch behavior.
- Named CBCC packets remain open; local workers do not impersonate those seats.
- Heimerdinker integrates, verifies, records, and stops at gates.

## Hard edges

No live/sandbox Plaid request, public-token exchange, Item custody, SQL/schema,
RLS, secrets, account filters that silently exclude user accounts, production
data, payment, staging, commit, push, deploy, or dashboard save action.
