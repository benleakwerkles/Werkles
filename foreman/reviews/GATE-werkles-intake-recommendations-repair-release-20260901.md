# Gate — Werkles Intake → Recommendations Repair Release

- **Gate:** Tier 1 production release
- **Decision:** APPROVED by Ben; Lady Jessica seal and Heimerdinker sign-off still required
- **Confidence:** HIGH for the bounded local behavior; production promotion remains conditional on the independent seal and candidate/live smoke
- **Candidate digest:** `1c8a07b7813105346422c24b5037a92d44a59374ba8abbd5d223f4ea22fc757a`
- **Baseline:** `866c4587b8f0f672552aab843d5cdf12e846a6af`
- **Branch:** `maker/site-g-20260703`

## Outcome

Ship the bounded repair that makes the public Intake usable before joining,
hands a completed device-local Intake into ranked Recommendations, removes the
production bakery/example personal fixture, prevents anonymous ghost-owner
fallback, and tightens recommendation copy and contrast without claiming
account custody.

## Evidence

- TypeScript: PASS
- Optimized Next production build: PASS
- Intake → Recommendations handoff contract: PASS
- Public browser-handoff honesty contract: PASS
- Intake legibility contract: PASS
- Desktop and 390px production-shaped renders: PASS
- Axe WCAG 2A/2AA: zero violations on Intake and Recommendations
- Manual review still owed for gradient/pseudo-element contrast items that axe
  reports as incomplete rather than failed

Rendered evidence:

- `foreman/reviews/intake-release-desktop-20260901.png`
- `foreman/reviews/intake-release-mobile-20260901.png`
- `foreman/reviews/recommendations-release-desktop-20260901.png`
- `foreman/reviews/recommendations-release-mobile-20260901.png`

## Blast radius

Twenty-two source/test files in the public Intake and Recommendations slice. No
provider activation, credentials, billing, schema/RLS, production-data
mutation, feature-flag change, or image spend.

## Known risks and halt conditions

- Device-local Intake does not follow the visitor to another browser or device;
  the UI must continue to say so.
- Signed-in account persistence remains on the existing account path; this
  release must not imply otherwise.
- Any anonymous ghost-data leak, bakery fixture, false account-save claim,
  console error, route failure, missing stylesheet, candidate digest mismatch,
  or non-manifest staged path halts promotion.
- Candidate URL smoke must precede alias promotion. The same route smoke must
  pass again on `werkles.com` after promotion.

## Approval phrases

- Approve: `APPROVE WERKLES INTAKE RECOMMENDATIONS REPAIR RELEASE`
- Reject: `REJECT WERKLES INTAKE RECOMMENDATIONS REPAIR RELEASE`
- Patch: `PATCH WERKLES INTAKE RECOMMENDATIONS REPAIR RELEASE: <changes>`

Ben approved in chat with the exact phrase `Approve.` after confirming these
changes were intended for a live push. That decision is recorded in
`foreman/gates/APPROVAL_LOG.md`.
