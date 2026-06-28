# NMCLR_METABOLISM_PROOF_CHAIN

Generated: 2026-06-24

Destination: TinkerDen Intake, Speaker

## Chain

```text
Packet A
Failure
Receipt
Lesson
Rule
Packet B
Different behavior
Proof artifact
```

## Meaning

This is the smallest honest metabolism proof chain.

Metabolism is not proven when Packet A fails.

Metabolism is not proven when the failure gets a receipt.

Metabolism is not proven when a lesson is written.

Metabolism is proven only when Packet B behaves differently because the organism carried the lesson forward into a rule, warning, constraint, checklist, default, gate, or packet template.

## Required Join

The proof artifact must join all of these:

- `packet_a_id`
- `packet_a_failure_receipt`
- `lesson_id`
- `rule_or_behavior_delta`
- `packet_b_id`
- `different_behavior_observed`
- `proof_artifact_path`

## Statuses

- `FAILURE_RECORDED`: Packet A failed and a receipt exists.
- `LESSON_EXTRACTED`: the receipt produced a specific lesson.
- `RULE_WRITTEN`: the lesson became a durable rule or behavior delta.
- `BEHAVIOR_CHANGED`: Packet B behaved differently because of the rule.
- `METABOLISM_PROVEN`: proof artifact joins Packet A failure to Packet B behavior change.

## False Metabolism

False metabolism occurs when:

- Packet A fails but no receipt exists.
- A receipt exists but no lesson is extracted.
- A lesson exists but no rule is written.
- A rule exists but Packet B ignores it.
- Packet B behaves differently but does not cite the rule or Packet A receipt.
- The proof artifact cannot join Packet A to Packet B.

## Smallest Rule

Failure is food only if the next packet behaves differently.
