# V — Twilio Verify test adapter at the reviewed factory slot

Date: 2026-08-20  
Foreman: Heimerdinker / Codex  
Execution context: CODEX_LOCAL on Betsy

## Best next infrastructure idea

Fill the existing `twilio_verify` factory-module slot with a server-only, dependency-injected adapter that can be attacked entirely offline:

- begin an SMS verification through an injected server client;
- return only a masked destination, ten-minute expiry, and provider operation reference for trusted custody;
- resolve the provider Verification SID from authoritative storage before checking or revoking;
- treat send/pending as no proof;
- emit a narrow provider observation only for exact `approved` status;
- map expired/failed/canceled/deleted/max-attempt states to non-favorable progress;
- compute a deterministic digest from sanitized provider facts;
- pass through the existing factory-acceptance and adapter-port boundaries;
- reject production while the static factory gate remains closed.

## Current official boundary

Twilio’s current Verify documentation says the check—not the send—validates the member token; approved is the favorable status, the default challenge expires after about ten minutes, and a Verification SID may be deleted after approval, expiry, or maximum attempts. The adapter must therefore preserve the provider SID in Werkles custody at begin and never interpret message delivery as possession.

## Do not

No credentials, environment reads, Twilio SDK import, network call, SMS, spend, route, account mutation, production composition, or claim persistence.

## Proof target

Offline fake-client begin/pending/approved/expired/revoke attacks; malformed SID/status/time/data rejection; dependency mutation resistance; factory-slot acceptance; port and composition regressions; full TypeScript and whitespace checks.
