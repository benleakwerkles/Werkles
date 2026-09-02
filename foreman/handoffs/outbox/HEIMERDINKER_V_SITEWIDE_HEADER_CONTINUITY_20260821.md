# V — Sitewide Header Continuity Audit

Date: 2026-08-21  
Foreman: Heimerdinker@Betsy  
Execution: `CODEX_LOCAL` on Betsy / local preview

## Vision

Every human-facing Werkles page must preserve one recognizable site identity:

- the shared public Werkles header is always present;
- signed-in or honestly identified local-preview members receive the same
  additive member row beneath it;
- route-specific navigation may appear below the shared header, never replace
  it;
- no page creates a competing logo, header, or navigation vocabulary that
  makes the member feel transported to another product.

## Audit

1. Inventory every `app/**/page.tsx` route and resolve whether it mounts the
   shared header itself or inherits it from the nearest layout.
2. Classify non-human surfaces (`api`, callbacks, generated review utilities)
   separately rather than forcing decorative UI onto them.
3. Browser-walk representative public, auth, Bellows, dashboard, membership,
   and Operator routes. Check one shared banner, primary navigation, additive
   member navigation where appropriate, content, and framework/console errors.
4. Repair common layouts rather than scattering page-level header imports.

## Acceptance

- Every ordinary page has exactly one shared Werkles banner.
- No ordinary page has a standalone replacement header.
- Member mode adds, not swaps, member navigation.
- Route-specific subnavigation stays below the shared header.
- Header labels and destinations come from the shared navigation source.
- Mobile layout does not remove Werkles identity or change destinations.

## Hard edges

Local UI/layout and verification only. No auth-policy change, provider action,
schema/RLS, production data, secrets, push, deploy, publication, or external
send beyond established CBCC relay packets.

## Stop condition

Stop after structural inventory, bounded common-cause repairs, focused tests,
and representative browser verification, or at a true human gate.
