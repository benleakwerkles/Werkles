# Vision — Match Deck → Crucible Claim Handoff

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
Requested review: Thufir, Petra, Ender, Bean, Doozer

## Problem

Match Deck preserves the chosen synthetic profile for Partnership Alignment and shared-Werkle practice, but Crucible ignores that context and presents a generic check catalog. The member cannot see why a check would matter to this relationship or whether a conversation should answer the question first.

## Candidate

- After one practice conversation, add `Decide What Needs Checking` beside alignment and shared-Werkle actions.
- Reuse the exact-keyed, bounded synthetic partnership context; create no new profile store.
- On Crucible, show the chosen profile's strongest fit reason and caution, then require one decision question: what claim would actually change whether the member proceeds?
- Tell the member to ask directly first when a conversation can answer it; use a provider only for the narrow evidence the work needs.
- Link back to Match Deck and Partnership Alignment.

## Review questions

1. Does this connect matching to verification without implying the practice profile is real or checked?
2. Does it resist “check everything” behavior and keep money behind relationship/work fit?
3. Is local context parsing strict enough to reject malformed or oversized input?
4. Does the handoff avoid selecting, running, or recommending a provider automatically?

## Hard edges

No real member/contact/introduction, provider start, claim verification, account write, schema, secret, payment, LLM, commit, push, or deploy.
