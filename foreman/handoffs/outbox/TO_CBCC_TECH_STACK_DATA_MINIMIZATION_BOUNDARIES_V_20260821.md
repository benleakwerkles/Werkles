# Vision — Eight-Service Data-Minimization Boundaries

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
Requested review: Thufir, Bean, Lady Jessica, Doozer

## Problem

The Crucible honestly shows what each service does and does not prove, but it does not yet make the planned custody boundary visible. Provider architecture, member copy, and the Plaid security story can drift unless all eight services have one machine-readable data-minimization contract.

## Candidate

- Register one planned—not-live—boundary for each of the eight tech-stack slots.
- State what Werkles would keep, what the provider would handle, and what must be deleted/revoked or separately retained.
- For Plaid, keep only a narrow dated threshold result plus receipt references; the raw account/balance/report payload stays out of member-visible storage, and the Item/report must be removed after the one-shot evaluation before a result is shareable.
- For Stripe Identity, keep scoped result/reference/timestamps—not document or selfie files.
- For billing, keep customer/subscription/event references—not card data.
- Render each boundary inside a collapsed disclosure so the member can inspect it without turning the page into a wall of text.

## Review questions

1. Does any boundary promise deletion the current implementation cannot enforce?
2. Does any wording confuse provider custody with Werkles custody or processor responsibility?
3. Is the Plaid one-shot lane consistent with the adapter's disposal contract and the founder's snapshot-only policy?
4. Are auth, phone, and Intake/profile custody stated honestly enough for a future privacy policy?

## Hard edges

Architecture and member disclosure only. No privacy-policy approval claim, legal conclusion, provider call, account mutation, schema, environment, secret, payment, commit, push, or deploy.
