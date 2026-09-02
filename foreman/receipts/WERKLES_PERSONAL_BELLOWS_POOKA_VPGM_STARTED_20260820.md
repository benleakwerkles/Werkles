# Receipt — Personal Bellows and Werkle Pooka VPGM started

Date: 2026-08-20
Execution context: CODEX_LOCAL on Betsy/Windows

## Operator findings applied immediately

- Recommendation and card titles now use consistent title capitalization.
- The general playbook summary preserves the title instead of lowercasing it.
- `Copy working draft` is now `Copy Draft to Clipboard` with an always-visible explanation that copying does not save, send, or attach anything.
- The recommendation bridge now says `Public Bellows lesson` and `Open the Public Bellows Lesson`; it explicitly says the Personal Bellows lesson has not yet been built from the draft.
- Live browser proof on the member Recommendations page confirmed all four visible titles, the corrected summary, clipboard label, public lesson label, and personal-lesson boundary.

## Current product truth

- Saving uses `sessionStorage` per recommendation kind. It survives navigation in the same browser tab but is not account- or Workshop-bound.
- Copying writes a plain-text three-field educational planning draft to the clipboard.
- The #1 artifact is the primary work product. Additional artifacts currently remain separate optional comparison drafts; they are not aggregated into one plan and should not be mandatory.

## CBCC review-first cycle

- Vision: `HEIMERDINKER_V_PERSONAL_BELLOWS_WERKLE_POOKA_20260820.md`
- Ender experience packet: prepared. The canonical Claude Desktop route is unavailable; no dispatch or review is claimed.
- Bean trust packet: prepared. The old browser courier could not prove its connection to the visible Bean task; no dispatch or review is claimed.
- Lady Jessica architecture packet and PGM: routed to the existing Cursor Agents window and placed in the established Maker message outbox. No review is claimed until an inbox receipt returns.

## Proposed product architecture under review

- Public Bellows: browsable lesson/catalog/store floor.
- Personal Bellows: owner-bound lesson queue derived from explicitly permitted member and Werkle state, with “why this appeared” provenance.
- One persistent Pooka identity per Werkle, selected from approved animal archetypes and vocation styles; never rerandomized on refresh and never presented as a human professional.
- Ghost Forge asset generation remains a separate spend/creative gate. No images were generated.

## Proofs

- `node scripts/foreman/recommendation-solution-path-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/recommendation-insight-not-echo-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS except expected Windows LF/CRLF warnings

No stage, commit, push, deploy, schema/RLS, provider call, secret access, or image-generation spend.

