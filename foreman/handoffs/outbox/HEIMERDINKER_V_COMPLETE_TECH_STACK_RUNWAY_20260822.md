# V — Complete Tech-Stack Runway

Date: 2026-08-22  
Foreman: Heimerdinker@Betsy  
Lane: member-facing integration architecture and local walkthrough

## Vision

Werkles should show one truthful, understandable map of the technology that supports a member from account creation through payment, records, optional checks, useful notifications, and privacy-respecting product learning. A provider logo is not a feature and a code stub is not a live integration.

The current Crucible journey covers Supabase Auth/Postgres/Storage, Stripe Billing/Identity, Plaid, Twilio Verify, and Checkr. Company canon also names PostHog and Expo Push, but the integration catalog and member journey omit them. Hosting and secret custody belong in the operator stack, not as member-facing claims.

## Pull

- Inventory canonical stack entries and actual local code/routes.
- Separate member-visible systems from operator/runtime infrastructure.
- Attack every readiness label for accidental live, saved, verified, or production claims.
- Decide whether PostHog and Expo Push belong in the member journey, and constrain them with data-minimization boundaries before adapters exist.

## Go

1. Complete the static catalog and member journey only where canon and code support it.
2. Give every service a narrow job, a current readiness state, an honest blocker, a data boundary, and a destination page or truthful unavailable destination.
3. Add regression checks that force exact catalog coverage and forbid production-live claims.

## Momentum

- Make the next milestone legible without exposing operator-only credentials or console links.
- Walk the Crucible at desktop and phone widths and repair only defects introduced by this slice.

## Hard edges

No provider calls, credentials, secret entry, OAuth, product creation, SMS, identity upload, payment, SQL/schema/RLS, tracking activation, push notification send, production toggle, push, deploy, or spend. No new vendor choice. No compatibility or trust score.
