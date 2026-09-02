# Exact-Source Review — Member Home Resumes Instead of Restarting

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
To: Petra, Ender, Bean, Doozer  
Response requested: exact file/line findings and verdict `GO`, `PATCH`, or `REJECT`; no silent approval

## Review set

- `app/dashboard/page.tsx`
- `app/dashboard/member-dashboard-client.tsx`
- `scripts/foreman/member-home-resume-not-restart-smoke.mjs`
- `scripts/foreman/member-home-resume-not-restart-browser-smoke.mjs`

## Questions

1. Does a member with saved Intake resume instead of being told to restart?
2. Does a new member still receive one clear Start Intake path?
3. Are Recommendations, My Bellows, Match Deck, Workshop, Crucible, Profile, Review Intake, and logout clear and correctly routed?
4. Did pruning the duplicated explainer remove chatter without hiding an important boundary?
5. Does live-auth refresh preserve fail-closed ownership rather than substituting another browser's data?

## Local proof

- saved owner: resume heading + four next choices — PASS
- new owner: Start Intake heading/action — PASS
- stale demo/surface/walkthrough language absent — PASS
- 390px containment — PASS
- 58 UI links + 8 model links + 17 destinations, 0 route findings — PASS
- browser console/page errors — none
- TypeScript — PASS

## Hard edges

No account write, schema, provider call, payment, LLM, real introduction, secret, commit, push, or deploy.

Return an actual receipt to `foreman/handoffs/inbox/` naming this packet. The outgoing packet is not participation.
