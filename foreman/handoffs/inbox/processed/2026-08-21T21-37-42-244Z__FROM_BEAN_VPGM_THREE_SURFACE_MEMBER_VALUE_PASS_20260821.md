# FROM BEAN — three-surface member value pass

Status: ACTUAL RESPONSE HARVESTED FROM THE EXISTING BEAN TASK
Verdict: REJECT
Lane: trust / compliance / hardening

This file is a faithful Foreman digest of Bean's returned review, not a claim of
filesystem-native authorship or custody.

## P0 findings

1. Free-text answers such as funds, ownership, or space can be laundered into
   structured-looking facts. They must remain explicitly self-reported and
   unverified, and must not become wealth/property ranking inputs without an
   explicit, bounded confirmation step.
2. A surface must not say an Intake, draft, or profile is saved to an account
   unless the same member state can be restored after navigation and refresh.

## P1 findings

- Do not pad a shortlist with weak people to make the Match Deck look full.
- Do not invent causality. Each recommendation and match needs a deterministic,
  human-readable reason tied to an actual Intake field or derived claim.
- Repeated Intake submissions need continuity; a stale or duplicate Intake must
  not silently replace the member's current state.

## Fail-closed acceptance examples

- `Funds: 1M` remains self-reported and unverified; it is not a ranking score.
- If only one strong candidate exists, show one candidate.
- Missing location produces no location-based claim and never falls back to IP
  inference.
- Refresh and navigation must reproduce the same state before the site claims
  account custody.

## Most dangerous polished lie

“We matched you based on your verified ownership and funds” when the product has
only parsed raw Intake language.

## Foreman boundary on this receipt

Bean also raised legal risk in broad terms. No legal conclusion is adopted from
that assertion. The product-integrity boundary above is adopted because it is
independently testable and consistent with Werkles's stated matching policy.
