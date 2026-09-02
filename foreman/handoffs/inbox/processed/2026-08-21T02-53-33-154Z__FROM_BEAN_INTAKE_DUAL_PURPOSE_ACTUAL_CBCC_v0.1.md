# FROM BEAN — INTAKE_DUAL_PURPOSE_ACTUAL_CBCC v0.1

Harvested by the Foreman from the existing signed-in Bean@Doss DeepSeek task.
This file is a normalized transcription, not a byte-for-byte raw export. Bean
wrote the answer; transport and formatting normalization were mechanical. The
raw provider reply hash and character count are retained below for correlation.

- Provider route: `https://chat.deepseek.com/a/chat/s/543b27a3-c249-472a-8dc1-daacfaf887d7`
- Packet: `TO_BEAN_VPGM_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1_20260816-1933.md`
- Packet sha256: `e2c8aa704ac0dda67bd1c406690bd62be22313329d054ef88f9fe5eec3ce8ddc`
- Reply sha256: `00c3305f0ff75df45570323b4fd09beb024d2c341addffd89df506761b23af57`
- Reply chars: `9869`
- CUSTODY: `CUSTODY_CHALLENGE_ECHOED__IDENTITY_PENDING` — exact task, signed-in seat, and challenge correlation are visible; correlation is not a cryptographic identity proof.

---

RECEIVED
CUSTODY_TOKEN: CUSTODY-BEAN-2F65DEBE51A80F90BAFFE2408887AFB6
COUSIN: BEAN
PACKET: TO_BEAN_VPGM_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1_20260816-1933.md
LANE_CHECK: IN_LANE — red-team audit and hardening only; no implementation, schema, or deployment
BLOCKER: NONE

## V — Vision

The dual-purpose Intake must be a plain-language instrument that collects explicit, member-authored signals for two uses:

- Next-move ranking — using current need, constraints, tried/considering/ruled-out paths, and time horizon.
- Honest starter profile — only fields the member explicitly stated; unknowns remain unknown.

The Intake must not launder weak inference into certainty, advice, eligibility, or a trustworthy matching profile. It should make clear to the member what was heard, what was not heard, and what is only a possible next move based on their own words.

Ben's 76-year-old mother's reaction is a valid acceptance test for the whole instrument: if the questions require insider vocabulary or identity, the instrument has already failed before any ranking logic runs.

## P — Attack of present signal model

The current five open-text questions do not cleanly separate:

- present need vs. background pain;
- goal vs. blocker;
- assets vs. constraints;
- tried vs. currently considering vs. ruled-out;
- time horizon vs. vague optimism;
- what the member can offer vs. what the member needs.

Specific failures to close:

- "What feels like the heaviest lift right now?" can mean time, money, emotional load, or skill gap. The system cannot safely map this to one signal without follow-up or treating it as unknown.
- "What have you already tried?" is history. A keyword matcher that ignores past tense, negation, or explicit failure will falsely activate current intent.
- "Where is time costing you the most?" is useful for constraints but must not be used as a goal.
- "What decision are you stuck on?" may reveal a blocker, but a stuck decision is not necessarily the next move.
- "If the next 12 months went well, what would be true?" captures desired outcome but not budget, time, assets, or constraints.
- "Best next steps" and "All options" look like output labels, not transparent ranking. Without member-answer citations, they look generic.

## G — Worked output

### 1. Minimum honest signal contract

These are conceptual fields, not a schema. Each may be explicitly stated, explicitly unknown, or blank. Preserve that distinction.

| Field | Meaning | May rank solutions | May seed matching | Blank/vague |
|---|---|---:|---:|---|
| Goal | Desired outcome for the next 12 months | Yes | Context only | UNKNOWN |
| Blocker | Heaviest current obstacle | Yes | No | UNKNOWN |
| Assets | Time, money, skill, equipment, network already held | Yes, for feasibility | Yes | UNKNOWN |
| Constraints | Money, time, legal, physical, location, capacity limits | Yes; can exclude/demote | Yes | UNKNOWN |
| Tried / considering / ruled-out | Paths with explicit member status | Yes | Yes, when explicit | UNKNOWN |
| Time horizon | Near-term versus long-term urgency | Yes | No | UNKNOWN |
| What member can offer | Explicit skills, resources, or help | Possibly | Yes | UNKNOWN |

Ranking primarily uses goal, blocker, constraints, path status, and time horizon. Matching primarily uses assets, constraints, offers, and explicit tried/ruled-out paths. No field may be filled by inference or promoted from UNKNOWN to probable without a direct member statement.

### 2. Fail-closed rules

**Negation.** If a member negates a need, goal, asset, or constraint near a known flag word, set current intent false. Treat it as ruled-out or unknown, never active.

**Historical attempts.** Past-tense paths are history only. They cannot raise a current option unless the member separately states present need. They may exclude or demote and should be visibly attributed to the member.

**Missing prerequisites.** If an option requires an unstated asset or constraint, label it `requires X you have not told us` and demote it. Do not assume the prerequisite exists.

**Financial or legal adjacency.** Tax, legal-structure, contract, insurance, hiring, funding, or regulated outputs must be general-resource language, not professional advice, and require an explicit member statement of that need.

**Low-confidence inference.** Below an explicit rule threshold, label an option `not enough information`; it may not outrank directly supported options or create a profile field.

**Unknown preservation.** Missing member offers remain UNKNOWN. Do not guess strengths, roles, or resources.

**Session custody.** Use only the current intake session unless the member explicitly consents to prior context. Never silently merge other tabs, sessions, or local entries.

### 3. Recommendation explanation contract

Every ranked option must include:

- the exact member phrase or phrases that raised it;
- the rule path that raised it;
- the member phrase or missing field that lowered or excluded it;
- one strength label: `directly supported`, `partial support`, `needs more information`, or `excluded by your answer`;
- a clear boundary: not advice, eligibility, guarantee, or a professional service.

Excluded options should say either `We did not include X because you said Y` or `We did not include X because you did not tell us Z.` General resources without direct member support must be labeled `general resource, not personalized` and rank below supported options.

Do not call the output objective `Best next steps`. Prefer `Possible next steps based on what you wrote.` Scores, if present, describe strength of support from stated answers, never probability of success.

## M — Acceptance gates

### P0 — before implementation acceptance

**Negation test.** `I do not need help with marketing. I need help with bookkeeping.` Marketing must be excluded; bookkeeping must rank above it; no marketing need may enter the profile.

**History test.** `I already tried Facebook ads and it did not work.` Facebook ads must not appear as a current next step; it may appear only as ruled out by the answer.

**Missing-prerequisite test.** `I need to hire someone but I don't have a budget yet.` Paid services must be demoted or marked as requiring an unstated budget; they must not outrank low-cost/free options.

### P1 — before live evaluation

**Explanation traceability.** Each top-three option must cite the exact member quote and rule path that raised it.

**Unknown preservation.** A blank `what can you offer` remains UNKNOWN; no inferred strength appears.

**Plain-language test.** A representative person without insider vocabulary must understand the questions and what the instrument heard. `I don't know what this means` fails the wording independently of ranking logic.

### P2 — before trust expansion

**Low-confidence handling.** `I'm just stuck.` must produce few options labeled as needing more information, not a confident personalized list.

**Legal/financial adjacency.** `I'm not sure what to do about contracts.` must produce educational-resource language, not imperative legal advice or a guaranteed outcome.

**Session boundary.** Two intake sessions in one browser must not silently merge profile signals.

No implementation may be accepted until P0 passes. P1 and P2 must pass before use with real members or exposure of a starter profile to matching.

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "generated_at": "2026-08-16T19:04:01-04:00",
  "custody_token": "CUSTODY-BEAN-2F65DEBE51A80F90BAFFE2408887AFB6",
  "VERDICT": "The Intake must preserve explicit member-authored goal, blocker, assets, constraints, path status, horizon, and offers; unknowns remain unknown, negation/history fail closed, and every recommendation cites the member words and rule path that raised or excluded it.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "Exact production custody, matcher implementation, and legal disclaimer wording remain outside this audit lane.",
  "source_packet_id": "TO_BEAN_VPGM_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1_20260816-1933",
  "source_packet_file": "TO_BEAN_VPGM_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1_20260816-1933.md",
  "platform": "DeepSeek",
  "role": "Hostile audit cousin",
  "lane": "Trust, compliance, hardening audits — not deploy execution.",
  "requested_action": "Independent red-team review of the dual-purpose Intake and Recommendations signal contract; findings and acceptance gates only.",
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "Do not make visual-style choices, write implementation code, apply schema, recommend deployment, push, enter secrets, or spend money.",
  "nextActionHash": "3c6b9478d4068004dc7cb88fbb167e4688f8e692865cdcd1aa381a350dc1912e",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a",
  "harvested_by": "FOREMAN_CHROME_EXISTING_TASK_HARVEST_V1",
  "provider_route": "https://chat.deepseek.com/a/chat/s/543b27a3-c249-472a-8dc1-daacfaf887d7",
  "packet_sha256": "e2c8aa704ac0dda67bd1c406690bd62be22313329d054ef88f9fe5eec3ce8ddc",
  "reply_sha256": "00c3305f0ff75df45570323b4fd09beb024d2c341addffd89df506761b23af57"
}
```
