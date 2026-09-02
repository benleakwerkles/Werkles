# LOCAL_BASELINE_ADMISSION — Intake / Recommendations specificity

Date: 2026-08-17
Foreman/student: Heimerdinker@Betsy
Instructor: Swanson/Petra

```text
candidate_hashes:
  - e6d18f1268fa2ae4c142dbb64fb70e55d8213491df3b0a8492234a4035b47c03  components/squibb/recommendation-surface.tsx
  - 6bacb2257c1f691b8fa2b8724ba603cea54c247140dba9f0729a109a254692a5  lib/squibb/member-facing-recommendation-summary.ts
  - b956e5c80c6cb5b8ed9bf702a4924ad55caf635a951c5b074e0c510f1dcabed3  scripts/foreman/recommendation-specificity-pilot-smoke.ts
  - 46275cccda8b367059d39ae916df1b3e86c8b42db42eb61fe129191094a5b829  scripts/foreman/recommendation-member-facing-summary-smoke.ts
  - fd8b8a02b2ef7d4f760695d53cab2a53263c3533f10b2f3928ad2ea731b81a05  scripts/foreman/pithy-recommendations-custody-smoke.ts
terminal_review_receipt_id: ea8e7a1c-2f55-44a0-b024-079c9be6e6c7
terminal_review_hash: 088f33dffadc188bfa8f86c6df7346c0154b9844760b727ccda23d60d8fb10ba
final_local_status: LOCAL_BASELINE_ADMITTED__NOT_PUSHED_NOT_DEPLOYED
exact_member_promise:
  - A locally submitted Intake opens a ranked recommendation readout that keeps the full answer readback collapsed and shows one nonempty member-facing why, caution, and next action without named internal gate/diagnostic text.
not_claimed:
  - not pushed
  - not deployed
  - not whole-page ready
  - not account custody
  - not durable account saving
  - not a complete matching engine
  - not proof that every recommendation is useful or sufficiently specific
walkthrough_result:
  - PASS: a synthetic local Intake submitted and navigated to /bellows/recommendations
  - PASS: the page acknowledged receipt without displaying the full Intake by default; the readback stayed collapsed
  - PASS: one ranked card was visibly selected and its why/caution/next-action structure was understandable
  - FAIL: the visible why repeated the stated need and the selected advice remained generic rather than explaining how the chosen option followed from the specific customer/equipment blockers
  - PASS: the page continued to /dashboard/blueprints and explicitly said the state was browser-session-bound, not account-bound
known_remaining_defects:
  - The prominent Why it fits field can echo the member's stated goal instead of explaining the causal connection between this specific recommendation and the structured blockers/assets that ranked it.
rollback_path:
  - Use the recorded pre-practical candidate hashes and a targeted reverse patch limited to recommendation-surface.tsx, member-facing-recommendation-summary.ts, and their focused smoke files; do not reset the dirty worktree.
next_smallest_member_facing_defect:
  - Replace stated-goal echo in Why it fits with one plain causal sentence tied to the selected recommendation and the member's structured blockers/assets.
next_mutation_allowed: NO
ben_transport_required: NO
```

## Walkthrough question

Can a member submit Intake, avoid a full Intake echo, understand the
recommendation cards, see useful option-specific advice, and resume the local
walkthrough without being told this is account custody?

`PARTIAL / NO.` Submission, echo control, card structure, continuation, and the
browser-only custody boundary all behaved observably as intended. Useful
option-specific advice did not clear the bar because the prominent fit sentence
repeated the goal and the action remained generic.

No code mutation follows this admission. The next defect remains review-locked.

Instructor grade: `PASS_FOR_LESSON_4`
Grade response: `54f9e3c2-35c3-460c-a061-dd173eafeec4`
