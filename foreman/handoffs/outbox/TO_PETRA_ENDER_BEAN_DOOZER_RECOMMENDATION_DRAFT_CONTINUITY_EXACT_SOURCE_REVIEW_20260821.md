# Exact-Source Review — Recommendation Draft Continuity

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
To: Petra, Ender, Bean, Doozer  
Response requested: exact file/line findings and verdict `GO`, `PATCH`, or `REJECT`; no silent approval

## Review set

- `lib/squibb/recommendations.ts`
- `lib/squibb/recommendation-device-drafts.ts`
- `app/bellows/recommendations/page.tsx`
- `components/squibb/account-aware-recommendation-surface.tsx`
- `components/squibb/recommendation-surface.tsx`
- `components/squibb/recommendation-work-path.tsx`
- `components/bellows/bellows-device-draft-shelf.tsx`
- `scripts/foreman/recommendation-draft-personal-bellows-continuity-smoke.mjs`
- `scripts/foreman/recommendation-draft-personal-bellows-continuity-browser-smoke.mjs`

## Questions

1. Does a saved Recommendation draft now produce a clear, findable result instead of a dead save?
2. Are `?option=` values exactly allowlisted and safe when missing or invalid?
3. Does stored-draft parsing reject malformed, oversized, array, non-string, and extra-key payloads?
4. Is the distinction between a small Recommendation draft and a deeper Bellows work product understandable?
5. Are Personal and Public Bellows links accurate without implying draft transfer or account sync?
6. Is the shelf usable and contained at 390px?

## Local proof

- Equipment draft save → My Bellows shelf → exact option reopen with restored value — PASS
- malformed Partner draft omitted from shelf — PASS
- invalid `option` safely falls back — PASS
- Personal and Public Bellows links both render — PASS
- 390px horizontal containment — PASS
- Personal Bellows, custody, recommendation-specificity, and route regressions — PASS
- 62 UI links + 8 model links + 16 destinations, 0 route findings — PASS
- browser console/page errors — none
- TypeScript — PASS

## Hard edges

No account write, cross-device sync, automatic field transfer, LLM, provider, schema, secret, payment, professional advice, commit, push, or deploy.

Return an actual receipt to `foreman/handoffs/inbox/` naming this packet. The outgoing packet is not participation.
