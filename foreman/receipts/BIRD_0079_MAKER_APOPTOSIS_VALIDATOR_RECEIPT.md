# BIRD_0079_MAKER_APOPTOSIS_VALIDATOR_RECEIPT

Receipt_ID: BIRD_0079_MAKER_APOPTOSIS_VALIDATOR_RECEIPT
Packet_ID: BIRD_0079_MAKER_APOPTOSIS_VALIDATOR
Status: ARTIFACT
Created_At: 2026-06-27T17:34:21-04:00
Artifact_Path: speaker/bin/speakerctl.js

## Summary

Built `validate-apoptosis` inside `speaker/bin/speakerctl.js`.

The command reads apoptosis patch JSON from `speaker/patches/`, validates it against `speaker/schemas/apoptosis_patch.schema.json`, enforces Ender/Claude reviewer boundaries, blocks `HARD_DELETE`, requires non-empty `reason` for `GRAVEYARD`, verifies every decision `doctrine_id` exists in `doctrine_index`, and appends a `PASS` entry to `speaker/logs/validation.jsonl` on success.

## JavaScript Source Artifact

```javascript
class ApoptosisValidationError extends Error {
  constructor(code, errors) {
    const details = Array.isArray(errors) ? errors : [String(errors)];
    super(`${code}: ${details.join("; ")}`);
    this.name = "ApoptosisValidationError";
    this.code = code;
    this.errors = details;
    this.exitCode = 1;
  }
}

function failApoptosisValidation(code, errors) {
  throw new ApoptosisValidationError(code, errors);
}

function validateApoptosis({ patchPath } = {}) {
  ensureDirs();
  const absolutePatchPath = resolveApoptosisPatchPath(patchPath);
  const schema = readJson(APOPTOSIS_PATCH_SCHEMA_PATH);
  let patch;

  try {
    patch = readJson(absolutePatchPath);
  } catch (error) {
    failApoptosisValidation("APOPTOSIS_PATCH_INVALID_JSON", [
      error instanceof Error ? error.message : String(error)
    ]);
  }

  const hardDeleteOutcomes = collectOutcomeValues(patch)
    .map(normalizeOutcome)
    .filter((outcome) => outcome === "HARD_DELETE");
  if (hardDeleteOutcomes.length > 0) {
    failApoptosisValidation("HARD_DELETE_FORBIDDEN", ["outcome HARD_DELETE is not legal in apoptosis patches"]);
  }

  const schemaErrors = validateValue(patch, schema);
  if (schemaErrors.length > 0) {
    failApoptosisValidation("APOPTOSIS_SCHEMA_MISMATCH", schemaErrors);
  }

  if (patch.reviewer.aeye !== "Ender") {
    failApoptosisValidation("APOPTOSIS_REVIEWER_AEYE_NOT_ENDER", [`reviewer.aeye=${patch.reviewer.aeye}`]);
  }

  if (patch.reviewer.model_family !== "Claude") {
    failApoptosisValidation("APOPTOSIS_REVIEWER_MODEL_FAMILY_NOT_CLAUDE", [
      `reviewer.model_family=${patch.reviewer.model_family}`
    ]);
  }

  const graveyardReasonErrors = patch.decisions
    .map((decision, index) => ({ decision, index }))
    .filter(({ decision }) => normalizeOutcome(decision.outcome) === "GRAVEYARD" && !String(decision.reason || "").trim())
    .map(({ index }) => `$.decisions[${index}].reason: GRAVEYARD requires non-empty reason`);
  if (graveyardReasonErrors.length > 0) {
    failApoptosisValidation("GRAVEYARD_REASON_REQUIRED", graveyardReasonErrors);
  }

  const doctrineIds = doctrineIdsFromPatch(patch);
  const db = openSpeakerDb();
  ensureSpeakerIndex(db);
  const missingDoctrineIds = [];
  const exists = db.prepare("SELECT 1 FROM doctrine_index WHERE doctrine_id = ? LIMIT 1");
  for (const doctrineId of doctrineIds) {
    if (!exists.get(doctrineId)) missingDoctrineIds.push(doctrineId);
  }
  db.close();

  if (missingDoctrineIds.length > 0) {
    failApoptosisValidation("DOCTRINE_ID_NOT_INDEXED", missingDoctrineIds);
  }

  appendApoptosisValidationPass({ patch, patchPath: absolutePatchPath, doctrineIds });
  const result = {
    ok: true,
    status: "PASS",
    command: "validate-apoptosis",
    patch_id: patch.patch_id,
    patch_path: sourceLabel(absolutePatchPath),
    schema_path: sourceLabel(APOPTOSIS_PATCH_SCHEMA_PATH),
    decisions_checked: doctrineIds.length
  };
  printResult(result);
  return result;
}
```

## Schema Match Sequence

```text
1. resolveApoptosisPatchPath() constrains input to speaker/patches/.
2. readJson() parses the patch and throws APOPTOSIS_PATCH_INVALID_JSON on parse failure.
3. collectOutcomeValues() blocks any outcome equal to HARD_DELETE before schema acceptance.
4. validateValue(patch, apoptosis_patch.schema.json) enforces patch_id, reviewer, and decisions[] shape.
5. Explicit reviewer checks require reviewer.aeye=Ender and reviewer.model_family=Claude.
6. Explicit GRAVEYARD check requires a non-empty reason string.
7. SQLite doctrine_index lookup requires every decisions[].doctrine_id to exist physically in the index.
8. appendValidationLog() writes status=PASS only after every structural boundary passes.
```

## Proof

```text
speakerctl syntax ok
{
  "ok": true,
  "status": "PASS",
  "command": "validate-apoptosis",
  "patch_id": "BIRD_0079_VALID_APOPTOSIS_PATCH",
  "patch_path": "patches/apoptosis_patch.json",
  "schema_path": "schemas/apoptosis_patch.schema.json",
  "decisions_checked": 1
}
```

HARD_DELETE negative proof:

```text
{
  "ok": false,
  "status": "ERROR",
  "code": "HARD_DELETE_FORBIDDEN",
  "errors": [
    "outcome HARD_DELETE is not legal in apoptosis patches"
  ]
}
hard_delete_blocked_exit=1
```

Validation log PASS entry:

```json
{"event":"validate_apoptosis","status":"PASS","timestamp":"2026-06-27T21:34:21.436Z","patch_id":"BIRD_0079_VALID_APOPTOSIS_PATCH","patch_path":"patches/apoptosis_patch.json","schema_path":"schemas/apoptosis_patch.schema.json","reviewer_aeye":"Ender","reviewer_model_family":"Claude","decisions_checked":1,"doctrine_ids":["BIRD_0058_APOPTOSIS_PROOF"]}
```

## Files

- `speaker/bin/speakerctl.js`
- `speaker/schemas/apoptosis_patch.schema.json`
- `speaker/patches/apoptosis_patch.json`
- `speaker/logs/validation.jsonl`
