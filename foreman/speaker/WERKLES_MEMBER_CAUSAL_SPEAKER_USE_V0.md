# Werkles member causal use of Speaker — V0

Status: **ACTIVE DIRECTION** (Operator, 2026-07-15)  
Does **not** modify `SPEAKER_CHARTER.md` (RATIFIED OFFICE V0).

---

## Separation rule

| Name | Job | System |
|------|-----|--------|
| **Speaker** (real office) | Causal memory — why a decision was made, what it taught, what not to repeat | Harvey / Nerdkle office; also usable for **member journey** memory inside Werkles |
| **Matching readout** | One-shot packaging of a single matching run (facts, card, scored paths) | `lib/matching` — formerly misnamed "Speaker" |

Matching must not call its packaging layer "Speaker."

---

## Use case inside Werkles

Speaker's real job fits Werkles when we help a member navigate over time:

- remember why a path was recommended or ruled out
- surface prior lessons so matching does not replay the same mistake
- keep context history for core business idea + collaboration with other members

That is **member-side causal memory**, not org doctrine and not the Matching readout.

---

## Current implementation

- Each shadow run carries `memberCausalDraft` (markdown DRAFT).
- Builder: `lib/matching/member-causal-draft.ts`
- Visible on `/operator/matching/shadow` for review.
- Not auto-ratified into `foreman/speaker/entries/`.
- Not written to Harvey Speaker sqlite as org wisdom.

---

## Hard stops

- Do not absorb Speaker into matching packaging.
- Do not ratify member drafts as Speakers office entries without Ben.
- Do not treat Matching readout as Speakers constitutional office.
- Public matching flip remains a separate human gate.
