# Werkles VPGM — CBCC_GHOST_MATCH_REDTEAM v0.1

**To Bean** (Hostile audit cousin · DeepSeek · Edge tab 4)
**Issued by:** Foreman (Lady Jessica / Maker, LOCAL_SALLY_WINDOWS)
**Doctrine:** STOP BEFORE SEND — Foreman prepares and pastes; Ben clicks Send.

## Slice under review

Owner-bound intake + rules-only person matching against a 150-member synthetic Ghost Fleet, wired into Workshop, Intros, Proof, and Dues.

## Context handed to the cousin

- Werkles is pre-launch. It matches a person carrying a problem with a person who can carry part of it. No money moves, no intros are sent, nothing is auto-submitted.
- This slice was built and tested by Foreman alone. No CBCC seat has reviewed it. That is why you are getting this packet.
- Environment: Local production build on Sally (Windows) at 127.0.0.1:3000. Not deployed. Vercel Production is hard-closed to the Ghost Fleet.
- Ghost Fleet = 150 SYNTHETIC members used as test users. Not real people. Faces are placeholders; no image spend has happened.
- Owner binding = an HTTP-only cookie (werkles_bellows_owner) holding an anonymous UUID. There is no account behind it yet.
- Matching is rules-only. No LLM, no probability claim. Points: capital complementarity +26 (and MINUS 14 when both sides chase the same money), partnership openness +18, offer-to-blocker word overlap up to +24, reciprocity up to +16, shared situation language up to +14, named geography +12, credential coverage +12. Total is clamped to 0-92 so an unverified synthetic can never read as certain.
- Every candidate renders its reasons and its blockers. Blocked members are excluded entirely; 'review_required' members are shown with a warning.
- Foreman's own red team: 40 synthetic seekers, each asserting cross-owner isolation, forged-cookie rejection, cookieless empty state, no blocked member offered, sane score band, and owner-bound Workshop/Proof/Dues. 40/40 pass. That is one agent grading its own homework.

## Verbatim member-facing strings

- Workshop: 'Your answers point at money or a guarantor. Werkles treats that as a hypothesis to test, not a diagnosis.'
- Intros: '#1 Omar Nguyen · fit 54 · synthetic' / 'Backer · Norfolk, VA'
- Intros reason: 'Why: Capital posture fits: You named funding or lease pressure. Omar Nguyen is positioned to back or co-sign rather than compete for the same money.'
- Intros reason: 'Why: Carries what is blocking you: Their stated coverage touches your blocker language: guarantor, lease.'
- Intros reason: 'Why: Same area named: You named Norfolk; this member works out of Norfolk, VA.'
- Intros blocker: 'Blocker: Unverified: Identity not verified.'
- Intros blocker: 'Blocker: Werkles cannot send, apply, introduce, or commit anything for you.'
- Intros empty state: 'No synthetic member scored an honest reason against your intake. Empty is a valid answer.'
- Proof: 'Identity check · not started · high priority' — 'Every ranked candidate you see is currently unverified. Yours is the half you control.'
- Proof: 'A pass shows that stated capacity was inspected on a date. It is not a credit decision, an approval, or a promise from anyone.'
- Dues: 'Intake on file · 5 of 5 answered · 12 ranked candidates'
- Dues: 'Dues do not verify you, fund you, introduce you, or vouch for anyone else.'
- Disclosure everywhere the fleet appears: 'Synthetic test members (Ghost Fleet). Not real people. Local/Preview Handeye use only until Operator promote phrase.'

## Known gaps disclosed up front

- Preview deploy is blocked: intake writes to the local filesystem and Vercel's is read-only. Fixing it means a Supabase table, which is a schema human gate.
- NEXT_PUBLIC_GHOST_FLEET_UI=1 opens member surfaces (Workshop, Proof) without sign-in on the walkthrough machine, with a visible banner. It is Local/Preview only by intent.
- Handeye test intakes and real intakes share one index file (data/squibb/concierge-intakes.jsonl); test rows are flagged testRun and their packets go to a separate directory.
- Proof checks are described honestly but cannot be started from this surface yet.
- Owner binding is a cookie. Clearing cookies loses the readout. No account recovery.

## Assignment

- **V:** No member can reach another member's intake, and no ranking can be mistaken for verification.
- **P:** The owner-binding model, the score model, and the disclosure language above.
- **M:** Return findings ordered by severity with a BLOCKER / SERIOUS / NOTE label on each. For every BLOCKER, state the smallest change that clears it. Do not recommend deploy, push, or SQL apply.
- **Out of lane:** No copy rewrites for tone, no visual design opinions — that is Ender. No deploy or push recommendations.

### G — work items

1. Cookie-only owner binding. An anonymous UUID in an HTTP-only cookie is the entire identity boundary. Attack it: shared machines, browser sync, cookie export, someone handed a laptop. What is the worst realistic disclosure, and what is the minimum fix short of full accounts?

2. Score-as-verification confusion. Scores cap at 92 and every card says the member is unverified. Is a capped number still read as a trust signal? Does 'fit 54' plus 'Identity not verified' create a contradiction a reasonable person resolves in the wrong direction?

3. Synthetic members inside a trust product. Real proof language ('Identity not verified', 'Funds not verified') is attached to people who do not exist. If a screenshot of this leaves the machine, what does it look like? What disclosure would you require before any non-Operator sees it?

4. The walkthrough auth bypass. NEXT_PUBLIC_GHOST_FLEET_UI=1 opens member surfaces with no sign-in. It is meant to be Local/Preview only. Assume it leaks to Production: what is exposed, and what guard should exist besides intent?

5. Test and real intakes in one index. Rows are flagged testRun and packets are separated, but the index is shared. Is that acceptable, or does test data need full separation before any real member exists?

6. Dues language. 'Dues do not verify you, fund you, introduce you, or vouch for anyone else.' Sufficient? Anything on the Dues surface that could be read as an outcome promise?

## Expected return

`foreman/handoffs/inbox/FROM_BEAN_CBCC_GHOST_MATCH_REDTEAM_v0.1.md`
with a filled `## Relay metadata` block. Validate with
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.

## Paste block delivered to the chat tab

```text
[WERKLES VPGM — CBCC_GHOST_MATCH_REDTEAM v0.1]

Bean (Hostile audit cousin, DeepSeek). Your lane: Trust, compliance, hardening audits — not deploy execution.

This is a real work request from the Werkles Foreman, not a role-sync ping. Everything
you need is in this message — do not ask for repo files.

SLICE UNDER REVIEW
Owner-bound intake + rules-only person matching against a 150-member synthetic Ghost Fleet, wired into Workshop, Intros, Proof, and Dues.

CONTEXT
- Werkles is pre-launch. It matches a person carrying a problem with a person who can carry part of it. No money moves, no intros are sent, nothing is auto-submitted.
- This slice was built and tested by Foreman alone. No CBCC seat has reviewed it. That is why you are getting this packet.
- Environment: Local production build on Sally (Windows) at 127.0.0.1:3000. Not deployed. Vercel Production is hard-closed to the Ghost Fleet.
- Ghost Fleet = 150 SYNTHETIC members used as test users. Not real people. Faces are placeholders; no image spend has happened.
- Owner binding = an HTTP-only cookie (werkles_bellows_owner) holding an anonymous UUID. There is no account behind it yet.
- Matching is rules-only. No LLM, no probability claim. Points: capital complementarity +26 (and MINUS 14 when both sides chase the same money), partnership openness +18, offer-to-blocker word overlap up to +24, reciprocity up to +16, shared situation language up to +14, named geography +12, credential coverage +12. Total is clamped to 0-92 so an unverified synthetic can never read as certain.
- Every candidate renders its reasons and its blockers. Blocked members are excluded entirely; 'review_required' members are shown with a warning.
- Foreman's own red team: 40 synthetic seekers, each asserting cross-owner isolation, forged-cookie rejection, cookieless empty state, no blocked member offered, sane score band, and owner-bound Workshop/Proof/Dues. 40/40 pass. That is one agent grading its own homework.

WHAT THE MEMBER ACTUALLY SEES (verbatim strings)
- Workshop: 'Your answers point at money or a guarantor. Werkles treats that as a hypothesis to test, not a diagnosis.'
- Intros: '#1 Omar Nguyen · fit 54 · synthetic' / 'Backer · Norfolk, VA'
- Intros reason: 'Why: Capital posture fits: You named funding or lease pressure. Omar Nguyen is positioned to back or co-sign rather than compete for the same money.'
- Intros reason: 'Why: Carries what is blocking you: Their stated coverage touches your blocker language: guarantor, lease.'
- Intros reason: 'Why: Same area named: You named Norfolk; this member works out of Norfolk, VA.'
- Intros blocker: 'Blocker: Unverified: Identity not verified.'
- Intros blocker: 'Blocker: Werkles cannot send, apply, introduce, or commit anything for you.'
- Intros empty state: 'No synthetic member scored an honest reason against your intake. Empty is a valid answer.'
- Proof: 'Identity check · not started · high priority' — 'Every ranked candidate you see is currently unverified. Yours is the half you control.'
- Proof: 'A pass shows that stated capacity was inspected on a date. It is not a credit decision, an approval, or a promise from anyone.'
- Dues: 'Intake on file · 5 of 5 answered · 12 ranked candidates'
- Dues: 'Dues do not verify you, fund you, introduce you, or vouch for anyone else.'
- Disclosure everywhere the fleet appears: 'Synthetic test members (Ghost Fleet). Not real people. Local/Preview Handeye use only until Operator promote phrase.'

KNOWN GAPS (already admitted — do not spend your answer rediscovering these)
- Preview deploy is blocked: intake writes to the local filesystem and Vercel's is read-only. Fixing it means a Supabase table, which is a schema human gate.
- NEXT_PUBLIC_GHOST_FLEET_UI=1 opens member surfaces (Workshop, Proof) without sign-in on the walkthrough machine, with a visible banner. It is Local/Preview only by intent.
- Handeye test intakes and real intakes share one index file (data/squibb/concierge-intakes.jsonl); test rows are flagged testRun and their packets go to a separate directory.
- Proof checks are described honestly but cannot be started from this surface yet.
- Owner binding is a cookie. Clearing cookies loses the readout. No account recovery.

--- YOUR ASSIGNMENT ---

V (vision): No member can reach another member's intake, and no ranking can be mistaken for verification.

P (pull): The owner-binding model, the score model, and the disclosure language above.

G (go) — work these, in this order:

1. Cookie-only owner binding. An anonymous UUID in an HTTP-only cookie is the entire identity boundary. Attack it: shared machines, browser sync, cookie export, someone handed a laptop. What is the worst realistic disclosure, and what is the minimum fix short of full accounts?

2. Score-as-verification confusion. Scores cap at 92 and every card says the member is unverified. Is a capped number still read as a trust signal? Does 'fit 54' plus 'Identity not verified' create a contradiction a reasonable person resolves in the wrong direction?

3. Synthetic members inside a trust product. Real proof language ('Identity not verified', 'Funds not verified') is attached to people who do not exist. If a screenshot of this leaves the machine, what does it look like? What disclosure would you require before any non-Operator sees it?

4. The walkthrough auth bypass. NEXT_PUBLIC_GHOST_FLEET_UI=1 opens member surfaces with no sign-in. It is meant to be Local/Preview only. Assume it leaks to Production: what is exposed, and what guard should exist besides intent?

5. Test and real intakes in one index. Rows are flagged testRun and packets are separated, but the index is shared. Is that acceptable, or does test data need full separation before any real member exists?

6. Dues language. 'Dues do not verify you, fund you, introduce you, or vouch for anyone else.' Sufficient? Anything on the Dues surface that could be read as an outcome promise?

M (momentum): Return findings ordered by severity with a BLOCKER / SERIOUS / NOTE label on each. For every BLOCKER, state the smallest change that clears it. Do not recommend deploy, push, or SQL apply.

OUT OF LANE: No copy rewrites for tone, no visual design opinions — that is Ender. No deploy or push recommendations.

--- HOW TO ANSWER ---

Reply as a markdown document Ben can save to foreman/handoffs/inbox/ as
FROM_BEAN_CBCC_GHOST_MATCH_REDTEAM_v0.1.md

End your reply with this exact block, filled in:

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "VERDICT": "<one line>",
  "CONFIDENCE": "HIGH | LOW",
  "UNKNOWNS": "none | <list> | outside my lane",
  "source_packet_id": "TO_BEAN_VPGM_CBCC_GHOST_MATCH_REDTEAM_v0.1_20260803-0741",
  "source_packet_file": "TO_BEAN_VPGM_CBCC_GHOST_MATCH_REDTEAM_v0.1_20260803-0741.md",
  "nextActionHash": "086ce991f8e566bbd82726d2d6de2d0e14818bd78c80ced82ef4080bc587466a",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a"
}
```

Do not recommend deploy, push, SQL apply, secret entry, or spending money. Those are
Operator gates. Say what you would do and stop.

```

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "generated_at": "2026-08-03T07:41:54.459Z",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a",
  "nextActionHash": "086ce991f8e566bbd82726d2d6de2d0e14818bd78c80ced82ef4080bc587466a",
  "source_files_included": [
    "foreman/NEXT_ACTION.md",
    "foreman/CURRENT_STATE.md"
  ],
  "REQUIRED_RESPONSE_FIELDS": [
    "schemaVersion",
    "cousin",
    "source_packet_id",
    "source_packet_file",
    "generated_at",
    "nextActionHash",
    "CONFIDENCE",
    "VERDICT",
    "UNKNOWNS"
  ],
  "packet_id": "TO_BEAN_VPGM_CBCC_GHOST_MATCH_REDTEAM_v0.1_20260803-0741",
  "source_packet_file": "TO_BEAN_VPGM_CBCC_GHOST_MATCH_REDTEAM_v0.1_20260803-0741.md",
  "network_command": "CBCC_GHOST_MATCH_REDTEAM",
  "network_command_version": "v0.1",
  "role_lane": "Trust, compliance, hardening audits — not deploy execution.",
  "human_gate_required": true,
  "edge_tab_index": 4,
  "edge_url": "https://chat.deepseek.com/"
}
```

