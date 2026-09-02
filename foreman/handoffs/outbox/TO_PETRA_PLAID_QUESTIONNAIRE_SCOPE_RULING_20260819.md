# To Petra — Plaid questionnaire scope and attestation ruling

Date: 2026-08-19
From: Heimerdinker@Betsy
Execution context: `CODEX_LOCAL`
Mode: personal review in the existing Petra task; no subagents or new task

## Current facts

- Live Plaid questionnaire: 11 security/privacy questions plus remediation attestation.
- Werkles is pre-launch.
- Stack: Next.js/React/TypeScript/Tailwind; intended Vercel; intended Supabase Auth/Postgres and planned Storage; Stripe Billing/Identity code paths; Plaid sandbox Link-token demo; Twilio foundation only; Checkr blocked.
- Plaid exchange/custody/evidence/webhook/revoke/receipt/schema/RLS are disabled or absent.
- Thufir downgraded old optimistic answers: contact supported; policy not operationalized; access control/internal MFA/TLS/encryption/vulnerability controls unverified; consumer MFA/consent/privacy/retention not complete.
- Live form is unchanged. No Save, attestation, Continue, or Submit is authorized.

## Personal assignment

Return a terminal scope ruling on:

1. Which questions may be staged from current facts without converting a plan into an attestation.
2. Which require a technical proof, policy artifact, legal judgment, or Ben's personal representation.
3. Whether the final remediation checkbox permits honest submission with disclosed gaps, or creates obligations too broad to accept now.
4. The exact safe review sequence before Ben sees the staged form.

Return `GO_TO_STAGE_FIELDS`, `PATCH_BEFORE_STAGE`, or `REJECT`. No form actions, personal contact data, provider calls, secrets, code, SQL, push/deploy, subagents, or new task.

