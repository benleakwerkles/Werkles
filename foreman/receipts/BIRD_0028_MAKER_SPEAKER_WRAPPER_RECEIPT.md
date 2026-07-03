# BIRD_0028 Maker Speaker Wrapper Receipt

PACKET_ID: BIRD_0028_MAKER_SPEAKER_WRAPPER
TO: Maker@Betsy
STREAM: INFRASTRUCTURE / ASSIMILATION
STATUS: ARTIFACT
RECEIPT_ID: RECEIPT_BIRD_0028_MAKER_SPEAKER_WRAPPER_20260627
TIMESTAMP: 2026-06-27T20:28:00Z

## Artifact

Built the local Speaker execution wrapper:

- `tinkarden/nervous_system/speaker_wrapper.js`

The wrapper watches or processes `tinkarden/change_capsules/*.md`, detects capsules with blank `## why_it_changed` and `## what_is_next`, fills only those Speaker-owned sections, and moves completed capsules into:

- `docs/tinkularity/change_capsules/`

## Provider Behavior

Provider order:

1. `SPEAKER_LLM_COMMAND`, if configured.
2. Ollama via `OLLAMA_HOST` + `SPEAKER_LLM_MODEL` or `OLLAMA_MODEL`, if configured.
3. Existing repo Aeye client via `SPEAKER_PROVIDER` or `AEYE_PROVIDER`, if configured.
4. Deterministic local Speaker fallback when no provider answers.

This proof used:

```text
provider: DETERMINISTIC_LOCAL_SPEAKER_FALLBACK
```

No secrets were requested, printed, or saved.

## Process Proof

Command:

```text
node tinkarden/nervous_system/speaker_wrapper.js process
```

Output:

```json
{
  "ok": true,
  "results": [
    {
      "status": "ARTIFACT",
      "provider": "DETERMINISTIC_LOCAL_SPEAKER_FALLBACK",
      "source_path": "tinkarden/change_capsules/raw_receipt_bird_0026_dink_change_capsule_generator.md",
      "destination_path": "docs/tinkularity/change_capsules/raw_receipt_bird_0026_dink_change_capsule_generator.md"
    }
  ]
}
```

## Completed Change Capsule

Completed file:

- `docs/tinkularity/change_capsules/raw_receipt_bird_0026_dink_change_capsule_generator.md`

Proof excerpt:

```text
## why_it_changed
- BIRD_0026_DINK_CHANGE_CAPSULE_GENERATOR turned a raw receipt into a reusable Change Capsule path instead of leaving Speaker memory trapped in transient queue data.
- Built capsule_generator.js to scaffold Change Capsules from raw receipts matters because the organism needs causal memory attached to build artifacts, not only a sender-side proof that something happened.
- The lesson is capture before expansion: Dink can scaffold facts, then Speaker can add why without overwriting the receipt or the builder's evidence.

## what_is_next
- Use tinkarden/change_capsules/capsule_generator.js as the intake generator for future raw receipts that need Speaker assimilation.
- Keep Dink-owned `what_changed` and `source_receipt` immutable while Speaker fills only the causal fields.
- Run the wrapper in watch mode once the local LLM provider is configured so blank capsules flow into canonical docs automatically.
```

## Safety Check

The wrapper aborts if `what_changed` or `source_receipt` changes during assimilation. The completed artifact preserved both Dink-owned sections.
