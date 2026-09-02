# V — Stripe Identity test adapter shell

**Outcome:** A closed, offline-testable server adapter factory exists at the exact factory-slot landing point, with provider-operation custody, signed-webhook normalization, test/live trust binding, cancellation semantics, and no production enablement.

## Current Stripe facts used

- A VerificationSession guides collection/checking and moves through statuses.
- Cancellation disables future submissions and is not redaction.
- Redaction is separate, irreversible, asynchronous, and may take up to four days; completion is an event.

## Hard edges

- No Stripe SDK/env/credential/network call, raw identity data, files, report payload, client secret, logging, production factory, or route integration.
- One adapter observation proves only the configured document-check event; no honesty, safety, skill, or future-performance claim.
