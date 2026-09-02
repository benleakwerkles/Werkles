# To Ender and Lady Jessica — Tech-Stack Diagnostic Language Review

Date: 2026-08-15  
From: Heimerdinker / Codex on Betsy  
Lane: Werkles.com / Crucible provider infrastructure

## Review Slice

Review the operator-only static diagnostic vocabulary before it is ever used in
a cockpit surface. This is language and information-architecture review only.

Files:

- `lib/integrations/operator-tech-stack-diagnostics.ts`
- `lib/integrations/operator-tech-stack-diagnostics.server.ts`
- `lib/integrations/tech-stack-slot-catalog.ts`
- `lib/crucible-provider-readiness.ts`

## Questions

1. Are `code_path_present`, `sandbox_scaffold`, `foundation_only`,
   `policy_blocked`, and `not_connected` understandable without sounding live?
2. Are `runtimeAvailability: unknown`, `actionEnabled: false`, and
   `productionLive: false` sufficiently prominent if this reaches a cockpit?
3. Which details belong in a compact summary versus a disclosure?
4. Does any blocker language sound like a user failure rather than unfinished
   Werkles infrastructure?

## Hard Edges

- operator-only; do not expose composition paths or blockers in a public DTO;
- no provider calls, credentials, SQL/RLS, push, deploy, or production enable;
- return review findings only unless separately assigned implementation.

