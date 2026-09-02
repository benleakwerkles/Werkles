# Vision — Personal Bellows Lesson Workspace

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
Requested review: Petra, Ender, Bean, Doozer

## Problem

My Bellows produces an account-aware working read, three exercises, and a finish line, but `Open [Artifact]` navigates to the generic Public Bellows lesson. The personalized reasoning disappears at the moment the member begins doing the work.

## Candidate

- Add `/bellows/personal/[slug]` for the six existing lessons.
- Keep the account-aware working read, exercises, and finish line above the same reviewed lesson and work-product component.
- Refactor the public lesson body/tool into one shared component so Public and Personal Bellows cannot drift.
- Keep `/bellows/library/[slug]` public and answer-free.
- Personal route may read the member's own recommendation session; rendered focus remains the non-echoing derived plan, not verbatim Intake answers.
- Return Personal routes to `My Bellows`; Public routes continue to return to Recommendations.

## Review questions

1. Does the route finally feel like a tailored lesson rather than a generic article after a personalized teaser?
2. Is the Public/Personal boundary truthful and technically preserved?
3. Does shared lesson/tool rendering prevent drift without creating client/server or accessibility regressions?
4. Does the account-error state fail closed instead of substituting another browser's lesson?

## Hard edges

No LLM call, new lesson content, account write, artifact synchronization, provider, schema, secret, payment, legal advice, commit, push, or deploy.
