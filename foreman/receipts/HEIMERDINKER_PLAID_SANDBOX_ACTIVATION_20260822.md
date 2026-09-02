# Heimerdinker receipt — Plaid sandbox activation

Date: 2026-08-22
Project: WERKLES_COM
Slice: PLAID_SANDBOX_ACTIVATION

## Confirmed state

- Plaid dashboard shows Sandbox access for the Werkles team.
- Plaid production access remains under provider review.
- The local Werkles runtime has no `PLAID_CLIENT_ID`, `PLAID_SECRET`, or `PLAID_ENV` fields in `.env.local`.
- The 1Password CLI/service-account route is not authenticated on Betsy, so keys were not copied into plaintext or stored insecurely.
- The current Link-token prototype initializes Plaid Assets; the Plaid onboarding lane previously selected Auth plus Balance. No product switch was made without a reviewed decision.

## Implemented

- Added a server-only, secret-free provider runtime snapshot.
- Crucible cards now receive actual runtime availability instead of always reporting `unknown`.
- Provider launch buttons fail closed when server credentials are absent.
- Member and operator copy now distinguishes granted Sandbox account access, connected Werkles runtime credentials, and pending Production access.
- Removed the false operator claim that Plaid was already live in Production.
- Repaired the Plaid adapter and privacy smoke entrypoints so their assertions execute under the repo's module setup.

## Verification

- `npm run typecheck` — PASS
- Plaid Link-token request contract — PASS
- Plaid Link lifecycle contract — PASS
- Plaid Link single-flight contract — PASS
- Crucible provider readiness manifest — PASS
- Crucible card action contract — PASS
- Plaid funds-disclosure privacy contract — PASS
- Plaid adapter boundary/disposal contract — PASS with the React server condition
- Browser walk of `/dashboard/crucible#check-funds` — card rendered with the new sandbox-access truth; no new page-specific console error observed

## CBCC custody

- Fresh packets issued for Computer, Bean, and Ender.
- Computer and Ender desktop routes were not provable: Computer's DevTools socket connected but did not answer; Ender's configured port was closed.
- Bean's packet is loaded in the established DeepSeek thread. It has not been sent and no Bean review is claimed.

## Next safe move

1. Restore secure 1Password CLI custody, then import and validate the existing Sandbox key pair without printing values.
2. Obtain the CBCC product decision on Auth plus Balance versus Assets.
3. Open the current Link-only sandbox flow from an authenticated Werkles test member.
4. Keep token exchange and any stored funds result disabled until the selected product's disposal and receipt lifecycle passes review.

