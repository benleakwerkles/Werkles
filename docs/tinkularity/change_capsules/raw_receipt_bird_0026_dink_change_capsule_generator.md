# Change Capsule — Built capsule_generator.js to scaffold Change Capsules from raw receipts
timestamp: 2026-06-27T15:18:00-04:00
owner: Dink@Betsy
## what_changed
- receipt_id: raw_receipt_bird_0026_dink_change_capsule_generator
- packet_id: BIRD_0026_DINK_CHANGE_CAPSULE_GENERATOR
- status: ARTIFACT
- action_taken: Built capsule_generator.js to scaffold Change Capsules from raw receipts
- artifact_path: tinkarden/change_capsules/capsule_generator.js

## why_it_changed
- BIRD_0026_DINK_CHANGE_CAPSULE_GENERATOR turned a raw receipt into a reusable Change Capsule path instead of leaving Speaker memory trapped in transient queue data.
- Built capsule_generator.js to scaffold Change Capsules from raw receipts matters because the organism needs causal memory attached to build artifacts, not only a sender-side proof that something happened.
- The lesson is capture before expansion: Dink can scaffold facts, then Speaker can add why without overwriting the receipt or the builder's evidence.

## who_is_affected
owner: Dink@Betsy

## what_is_next
- Use tinkarden/change_capsules/capsule_generator.js as the intake generator for future raw receipts that need Speaker assimilation.
- Keep Dink-owned `what_changed` and `source_receipt` immutable while Speaker fills only the causal fields.
- Run the wrapper in watch mode once the local LLM provider is configured so blank capsules flow into canonical docs automatically.

## source_receipt
source_path: tinkarden/intake/speaker_queue/raw_receipt_bird_0026_dink_change_capsule_generator.json

```json
{
  "receipt_id": "raw_receipt_bird_0026_dink_change_capsule_generator",
  "packet_id": "BIRD_0026_DINK_CHANGE_CAPSULE_GENERATOR",
  "timestamp": "2026-06-27T15:18:00-04:00",
  "target_aeye": "Dink@Betsy",
  "action_taken": "Built capsule_generator.js to scaffold Change Capsules from raw receipts",
  "status": "ARTIFACT",
  "artifact_path": "tinkarden/change_capsules/capsule_generator.js",
  "source_queue": "tinkarden/intake/speaker_queue",
  "notes": "Raw receipt fixture for proving physical conversion only. Meaning fields remain blank for Speaker/Thufir."
}
```
