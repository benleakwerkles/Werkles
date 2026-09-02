# From Bean — location-aware Ghost shortlist attack

Status: `RECEIPT_VALIDATED__READY_FOR_FOREMAN_ASSIMILATION`  
Harvested: 2026-08-20  
Provider surface: exact existing Bean / DeepSeek task  
Custody token: `CUSTODY-BEAN-4BA7BD402033D546CD79164943EB1645`  
Source packet: `TO_BEAN_VPGM_LOCATION_AWARE_GHOST_SHORTLIST_ACTUAL_CBCC_20260820_v0.1_20260821-0156.md`  
Bean verdict: `PATCH (P0 fixes required before GO)`

## Validation boundary

Bean personally returned a substantive trust attack through the established
task. Bean explicitly reviewed the self-contained packet and did not inspect
Betsy's dirty source. Claims labelled as executed attacks in the provider
response were hypothetical design counterexamples, not local runtime proofs.
Foreman must reconcile them against source before changing code.

## Bean's strongest findings

1. Identity for any stored location preference must come only from an
   authenticated server principal; a caller-provided member identifier or a
   forged cookie must never become production account authority.
2. Malformed city/state/work-preference values must reject without widening the
   search. No IP or other inferred location fallback.
3. Location must not manufacture a match with no substantive fit.
4. A materially stronger distant fit must not be buried merely because a weak
   candidate is nearby. Location may reorder close fits, not replace fit.
5. Diversity selection must not use a location-inflated threshold that quietly
   excludes substantively stronger lanes or roles.
6. Public errors/logs should expose neither submitted location values nor raw
   profile location; member-facing results may show the member's own location
   and coarse candidate band only.
7. Future durable preference storage needs authenticated ownership,
   idempotency/version discipline, explainability, and an update/clear path.

## Foreman source reconciliation

- Production/account GET already derives identity from `requireUser(request)`
  and reads the profile by `auth.user.id` through the request-scoped Supabase
  client. It accepts no caller member ID.
- The cookie preference route is now gated by both Ghost Fleet and the local
  route-preview unlock; it is not a production account-storage seam.
- State and work preference already use strict allowlists; malformed values
  return null/reject, and no IP/geocoder fallback exists.
- Zero-substantive-fit candidates are filtered before location ordering.
- The remaining valid defect is ordering: the current location adjustment can
  promote a materially weaker nearby candidate, and diversity's reasonable-fit
  floor uses location-adjusted score. This is the bounded PATCH target.
- Durable account preference writes remain outside this local slice and require
  the existing schema/RLS human gate.

## Assimilation decision

`FOREMAN_ASSIMILATED` for fit-first ordering and diversity-floor hardening.
Hypothetical cross-account, replay, and RLS claims are retained as future
persistence attack cases, not reported as proven current exploits.
