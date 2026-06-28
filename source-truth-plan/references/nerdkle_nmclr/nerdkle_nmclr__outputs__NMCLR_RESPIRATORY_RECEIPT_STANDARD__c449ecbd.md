# NMCLR_RESPIRATORY_RECEIPT_STANDARD

Generated: 2026-06-23  
Updated: 2026-06-24

Destination: TinkerDen Intake, Speaker

## Breathing Proof Definition

An NMCLR respiratory receipt proves one complete evidence breath:

`intake -> process -> exhale`

The receipt must not claim a full breath unless all three proof stages are present.

## INTAKE_PROOF:

Intake is proven only when the system can show that an input artifact was actually observed from a known intake surface.

Minimum proof:

- `intake_surface`: exact watched/scanned source.
- `input_artifact_path`: exact path or URL.
- `input_artifact_hash`: hash of the bytes observed.
- `input_artifact_bytes`: byte count.
- `intake_timestamp`: when the artifact was observed.
- `intake_method`: `scanner`, `watcher`, `manual_readback`, or `receiver_readback`.
- `intake_event_id`: JSONL/event/receipt id proving the observation.

Not enough:

- A `DESTINATION:` label.
- A chat claim.
- A UI card.
- A filename without hash.
- A local sender-side file that was never scanned or read back.

## PROCESS_PROOF:

Process is proven only when the system can show that the intake artifact was acted on and produced a traceable intermediate or output.

Minimum proof:

- `process_actor`: human, Aeye, script, command, or service.
- `process_started_at`
- `process_completed_at`
- `process_action`: exact operation performed.
- `process_input_hash`: must match `input_artifact_hash`.
- `process_output_path`: exact output path.
- `process_output_hash`: hash of produced output.
- `process_status`: `PASS`, `PARTIAL`, `BLOCKED`, or `FAIL`.
- `process_receipt_path`: receipt proving the process step.

Not enough:

- A running process with no output.
- A log line with no input hash.
- A generated artifact with no link back to the intake.
- A status invented from tone, intent, or mission title.

## EXHALE_PROOF:

Exhale is proven only when the processed output reaches its declared destination and that destination is read back.

Minimum proof:

- `exhale_destination`: exact destination surface.
- `exhale_output_path`: exact written artifact path.
- `exhale_output_hash`: hash at destination.
- `exhale_output_bytes`: byte count at destination.
- `exhale_timestamp`
- `receiver_readback_path`: exact readback receipt, index entry, inbox row, or receiver-side state file.
- `receiver_readback_hash`: hash observed from destination side.
- `exhale_status`: `EXHALE_PROVEN`, `EXHALE_PARTIAL`, `EXHALE_BLOCKED`, or `EXHALE_FAILED`.

Not enough:

- Sender-side storage alone.
- A message saying `RETURN TO Speaker`.
- A file copied without readback.
- A browser-local mark.
- A static cockpit link.
- A pickup row that is not consumed or read back by the intended receiver.

## MINIMUM_RECEIPT_FIELDS:

Every respiratory receipt must include:

- `schema_version`
- `receipt_id`
- `breath_id`
- `mission`
- `created_at`
- `created_by`
- `source_machine`
- `destination`
- `intake_surface`
- `input_artifact_path`
- `input_artifact_hash`
- `input_artifact_bytes`
- `intake_timestamp`
- `intake_event_id`
- `intake_proof_status`
- `process_actor`
- `process_action`
- `process_started_at`
- `process_completed_at`
- `process_input_hash`
- `process_output_path`
- `process_output_hash`
- `process_receipt_path`
- `process_proof_status`
- `exhale_destination`
- `exhale_output_path`
- `exhale_output_hash`
- `exhale_output_bytes`
- `receiver_readback_path`
- `receiver_readback_hash`
- `exhale_proof_status`
- `overall_status`
- `missing_proof`
- `false_breathing_checks`
- `blockers`

Recommended status values:

- `INTAKE_PROVEN`
- `INTAKE_UNVERIFIED`
- `PROCESS_PROVEN`
- `PROCESS_PARTIAL`
- `PROCESS_BLOCKED`
- `EXHALE_PROVEN`
- `EXHALE_PARTIAL`
- `EXHALE_BLOCKED`
- `BREATH_COMPLETE`
- `FALSE_BREATHING`

## FALSE_BREATHING_CASE:

False breathing means the system looks alive but no complete intake-process-exhale proof exists.

Examples:

1. Intake was seen, but no process receipt exists.
2. Process ran, but output cannot be tied to the intake hash.
3. Output was written locally, but destination readback is missing.
4. `DESTINATION: TinkerDen Intake` appears in a file, but no receiver-side TinkerDen artifact exists.
5. Static cockpit button writes `localStorage`, but no file-backed packet or receipt exists.
6. Receipt pickup finds a receipt, but no active command surface consumes it.
7. Chokidar/watcher is installed or specified, but no JSONL event proves it observed the artifact.
8. A bridge/test artifact exists and is mistaken for real action/exhale proof.

Rule:

If any of intake, process, or exhale is missing, the overall status must not be `BREATH_COMPLETE`.

Use:

- `FALSE_BREATHING` when the UI/process implies completion without proof.
- `PARTIAL_BREATH` when the receipt honestly names the missing proof.

## GO / CONDITIONAL GO / NO-GO:

GO:

- Adopt this receipt standard for NMCLR respiratory proof.
- Use it for future scanner, watcher, receipt pickup, stale detector, and delivery verification receipts.

CONDITIONAL GO:

- Build automation only if it remains boring, local, file-backed, and readback-based.
- Chokidar/watcher may observe and append events, but must not auto-assimilate, auto-merge, auto-delete, or auto-claim delivery.

NO-GO:

- No `BREATH_COMPLETE` claim without intake proof, process proof, and exhale proof.
- No delivery/exhale claim from sender-side storage alone.
- No active-command claim from a static cockpit page.
- No assimilation claim without a downstream doctrine, packet, behavior, or receiver-side artifact proving it.

## Smallest Implementation Target

One append-only JSONL event stream may record the breath stages:

- `intake_seen`
- `process_started`
- `process_completed`
- `exhale_written`
- `receiver_readback_seen`
- `breath_complete`
- `false_breathing_candidate`

The first useful implementation should report missing proof. It should not repair, retry, assimilate, or dispatch work automatically.
