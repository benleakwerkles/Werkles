# V — Provider begin custody handoff

Date: 2026-08-20  
Seat: Heimerdinker / Codex Foreman  
Lane: provider infrastructure, local/offline only

## Vision

The adapter port currently requires a Werkles operation reference before a
provider begin call, but real providers create their own session/check/report
identifier during that call. The port has no place to return that server-only
provider reference to durable lifecycle custody. A concrete adapter would have
to hide persistence inside an SDK wrapper or discard the identifier.

Add an optional server-only provider-operation reference to validated begin
results and require the composition root to pass it into lifecycle outcome
finalization. Strip it from every member-facing result.

## Official source check

Twilio's current Verify API documents that starting a Verification creates a
provider Verification SID, while a successful send remains `pending`; only a
Verification Check can return `approved`. Twilio also documents the normal
challenge lifetime as ten minutes and supports cancellation in limited cases.
This validates the need for separate post-begin provider custody.

## G ideas

1. Extend every raw begin-result shape with an optional bounded
   `providerOperationRef`, accepted only through exact runtime validation.
2. Add it to the atomic lifecycle finalization outcome on successful begin;
   failure and revoke paths carry null.
3. Prove the reference reaches the trusted finalizer, never reaches the public
   begin response, and malformed/extra/ref-substitution outputs fail closed.

## Hard edges

No SDK, network/provider call, env/secret, persistence implementation,
schema/RLS, route/UI, production composition, push, deploy, or spend. The
reference is not evidence and cannot create a claim.

## Stop condition

Stop after port, factory, composition hostile smokes, TypeScript, and whitespace
proof are green, or at a true human gate.
