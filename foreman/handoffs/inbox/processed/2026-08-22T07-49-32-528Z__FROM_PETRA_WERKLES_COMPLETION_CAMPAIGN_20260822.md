# From Petra — Werkles Completion Campaign

Date harvested: 2026-08-22  
Existing provider task: `6a3019f8-3b50-83ea-8bcb-c8dde82fb498`  
Personal work: `YES`  
Subagents or downward delegation: `NONE`  
Terminal state: `CAMPAIGN_MAP_READY`

## Journey acceptance

| Stage | Acceptance proof | Risk |
|---|---|---|
| Home | Understandable promise, clear next step, no false capability claims | Medium |
| Authentication | Identity survives refresh/revisit; no login loop | High |
| Intake | Exact persistence, reopen/edit, no loss | High |
| Recommendations | Materially derives from saved Intake; no generic mirror | High |
| Workshop | Persistent, versioned, resumable, provenance retained | High |
| Match Deck | Diverse ranked candidates, explainable evidence, privacy boundaries | High |
| Conversation | Policy-allowed natural conversation survives interruption | High |
| Werkle Formation | Mutual consent, provenance, expectations, authorship | High |
| Personal Bellows | Longitudinal work and corrections accumulate | Medium |
| Membership | Truthful entitlement; no phantom subscription | Medium |
| Profile | Stable identity and accurate editable persistence | Medium |
| Crucible | Truthful provider state; no unsupported verification claim | Medium |

## Ordered completion slices

1. **Identity & Persistence Spine — BUILD.** Same authenticated member after
   refresh/revisit; Intake, Workshop, and Profile reopen; no duplicates or silent
   loss. Dependency: Supabase auth/session and persistence.
2. **Intake → Recommendation Truth Chain — BUILD.** Recommendations materially
   differ by saved member input; no generic or mirrored output. Dependency: slice 1.
3. **Workshop Lifecycle — BUILD.** Accepted work persists, versions, resumes, and
   keeps provenance. Dependency: slice 1.
4. **Match → Conversation → Werkle — MERGE.** Explainable ranking, bounded privacy,
   mutual consent, aligned expectations, provenance, and one two-party Werkle.
   Dependency: slice 3.
5. **Membership / Provider Truth Layer — BUILD.** Stripe, Plaid, Twilio, Supabase,
   and Crucible status is truthful and never overclaimed. Dependency: provider
   readiness.

## Cross-review assignments

- Ender: navigation, accessibility, visual trust, coherence, journey continuity.
- Bean: auth/privacy abuse, consent failure, ranking manipulation, leakage.
- Computer: persistence, session integrity, restoration, performance, recovery.
- Skybro: onboarding clarity, promise, explanation, expectations, recommendation value.
- Doozer: friction, click reduction, dead ends, execution simplicity.
- Lady Jessica: consent language, human trust, relationship expectations, tone,
  privacy comprehension.
- Heimerdinker: integration, dependencies, duplicate removal, release cohesion,
  ship readiness.

## Exact next packet seed

`WERKLES_COMPLETION_SLICE_01_IDENTITY_PERSISTENCE`

Eliminate authentication, session, and saved-state failures across Home → Auth →
Intake → Recommendations → Workshop → Profile. Exit only when refresh,
logout/login, browser restart, and revisit preserve the correct member and saved
work without duplication or loss, and recommendations resume from persisted
state. Use existing auth/persistence only; no new provider rollout or gate change.

