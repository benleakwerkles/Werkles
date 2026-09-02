# Mack Architecture Attack Scorecard

Status: COMPANION ARTIFACT V0.1
Date: 2026-07-06
Owner: Heimerdinker@Betsy
Lane: Harvey/Nerdkle architecture review

## Purpose

This scorecard turns "Mack, tear this apart" into a review surface that Ben and the Aeyes can use without translating a loose critique back into build work.

It is meant to be harsh. A high score means the architecture is specific, falsifiable, and buildable. A low score means the prose is outrunning the machinery.

Truth boundary: this scorecard has not been filled by Mack. It does not claim external send, Mack review, Mack return, universal receiver proof, or solved real-time Aeye cooperation.

## Scoring Scale

| Score | Meaning |
| --- | --- |
| 0 | Not credible, not specified, or mostly vibes. |
| 1 | Interesting but underspecified; likely to fake success. |
| 2 | Buildable with clear blockers and receipts. |
| 3 | Strong enough to ship into the next build packet. |

Each score needs evidence, not taste alone.

## Attack Dimensions

| Dimension | Attack question | Score | Required evidence |
| --- | --- | --- | --- |
| Central claim | Is "human as missing message bus" true enough to carry Chapter One? | TBD | Quote the strongest sentence and the weakest overreach. |
| Cooperation model | Does "shared body-state, not shared mind" solve the actual Aeye cooperation problem? | TBD | Name the first place packeted cooperation still fails. |
| Custody spine | Does `Intent -> Packet -> Gate -> Bus -> Boot Context -> Execution -> Receipt -> Ledger -> Readback` cover the real workflow? | TBD | Identify one missing transition or unnecessary organ. |
| Contract canon | Are packet, receipt, event, gate, and boot-context contracts the right first build? | TBD | Name one required field that is missing or one field that is decorative. |
| Gate model | Is "Classifier decides. Policy narrows. OS enforces. Receipts prove." enough? | TBD | Name where enforcement is still prose instead of OS/API boundary. |
| Receiver proof | Does the architecture prevent sender-side custody from masquerading as receiver completion? | TBD | Name one path where ACK, custody, and completion can still blur. |
| Boot context | Does stale world-state reliably block Aeye action? | TBD | Name one Aeye surface that can still bypass boot context. |
| Event spine | Can packet, event, receipt, artifact, and next action join by id? | TBD | Name the join that would fail first under stress. |
| Cockpit readback | Can Ben return after four hours and see state without reconstructing the thread? | TBD | Name the one screen or field still missing. |
| Secret and human gates | Do 1Password, provider dashboards, deploy, money, and legal/compliance gates stay human-owned? | TBD | Name one gate that must never be automated silently. |
| Minimal MVP | What is the smallest build that proves momentum? | TBD | Choose one: contract canon, event join, boot enforcement, receiver proof, cockpit readback. |
| Manuscript balance | Does the prose preserve myth without overclaiming the machinery? | TBD | Mark one sentence to keep and one sentence to cut or quarantine in appendix. |

## Fatal Flags

If any of these are true, the architecture must return `REVISE` or `REJECT`:

- It claims real-time shared Aeye consciousness without a falsifiable mechanism.
- It treats a prompt, watcher, or classifier as containment.
- It treats a sender-side packet write as delivery proof.
- It treats transport ACK as receiver work completion.
- It routes secrets through chat, logs, or source files.
- It lets stale world-state become current truth.
- It requires Ben to keep being the clipboard/message bus after claiming otherwise.
- It cannot produce a next legal command from the cockpit.

## Return Block

Mack should return this block after scoring:

```text
MACK SCORECARD RETURN
status: ACCEPT | REVISE | REJECT
overall_score_0_to_36:
central_claim_score:
cooperation_model_score:
custody_spine_score:
contract_canon_score:
gate_model_score:
receiver_proof_score:
boot_context_score:
event_spine_score:
cockpit_readback_score:
secret_and_human_gates_score:
minimal_mvp_score:
manuscript_balance_score:
strongest_objection:
highest_risk_fake_success_path:
first_momentum_build:
must_change_before_book:
optional_later:
```

## Aeye Conversion Rule

If Mack returns `ACCEPT`, the next build packet may preserve the current sequence and choose the first momentum build.

If Mack returns `REVISE`, the next build packet must include Mack's `must_change_before_book` items as acceptance criteria.

If Mack returns `REJECT`, no next-build packet should be generated until Ben explicitly accepts a replacement architecture direction.

No Aeye should convert this scorecard into a next-build packet without Ben's acceptance gate.
