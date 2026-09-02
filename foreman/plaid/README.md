# Plaid Partnership Readiness — Werkles

Status: **V0 SUPERSEDED — DO NOT SEND** (superseded 2026-08-21)

Current Plaid-facing brief: `PLAID_PRODUCTION_ONBOARDING_BRIEF_V1.md`

## Purpose

Historical package for the July persistent-Item concept. It does not represent the current Operator doctrine and must not be sent to Plaid as the current Werkles use case.

Current doctrine is a user-initiated, narrow Backer-lane snapshot: match people on goals, interests, temperament, and useful fit first; use Plaid only when a later conversation needs a dated financial eligibility fact; never rank people by balance or wealth; retain no raw financial data; remove the Plaid Item and report after evaluation; keep only a scoped, expiring result.

## Files (read in order)

| # | File | Audience |
|---|------|----------|
| 1 | `company/PLAID_PERSISTENT_LIQUIDITY_PROOF_V0.md` | Doctrine / constitutional limits |
| 2 | `PLAID_API_TEAM_BRIEFING_V0.md` | Historical only — do not send as current use case |
| 3 | `PLAID_TECHNICAL_SPEC_V0.md` | Engineering — APIs, schema, webhooks |
| 4 | `PLAID_SCHEMA_DRAFT_V0.sql` | DRAFT migration — **not applied** until gate |
| 5 | `PLAID_PARTNERSHIP_CHECKLIST_V0.md` | Operator prep before call |
| 6 | `../receipts/PLAID_PARTNERSHIP_READINESS_20260710.md` | Build receipt |

## Historical code gap

- Sandbox Link token creation exists.
- Public-token exchange, encrypted Item custody, receipts, revocation, and webhooks remain disabled or unconnected.
- The current design does **not** authorize persistent Item custody.

## Proposed gates

- Retired historical phrase: `APPROVE PLAID PERSISTENCE SCHEMA`
- Current production enablement still requires a separately reviewed implementation and explicit Operator approval after privacy/security controls are proven.
