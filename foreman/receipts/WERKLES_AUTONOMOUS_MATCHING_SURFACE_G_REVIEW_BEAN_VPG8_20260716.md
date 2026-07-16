# Werkles Autonomous Matching Surface - Bean G Review VPG8

Status: `GO - LOCAL CONTAINMENT AND SAVE-TRUTH SLICE`
Date: 2026-07-16
Seat: Bean hostile G re-review
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch: `maker/site-g-20260703`
Reviewed HEAD: `d183d8bcab872c001ac0ba740fc8d9f86ec4efa0`
Public mode: `ON`
LLM mode: `OFF`

## Packet reviewed

`foreman/handoffs/outbox/TO_HEIMERDINKER_AUTONOMOUS_MATCHING_SAVE_TRUTH_VPG8_20260716.md`

Packet SHA-256:

`c116c92c3a4ca89fe5dcde993c88f6b00db77eee36575186b926b1d51587cb57`

The amended packet keeps public Autonomous Matching naming/mode ON while requiring the recommendation page to remain example-only, empty-ledger, and disconnected from global/latest personal readers until authenticated owner binding exists.

Bean did not edit any product file, start a server, stage, commit, push, deploy, or change a feature flag. The only Bean write in this re-review is this G receipt.

## Verdict

`GO` for the local VPG8 Heimerdinker containment and save-truth slice.

The earlier P blocker is closed in the reviewed diff:

- public mode remains ON
- the page loader always constructs the static example
- the loader imports and calls no global/latest personal reader
- the returned ledger is always empty
- the actual serializable page-data object contains no personal/path fields or path prefixes
- all three save controls are natively disabled and have no client transport or action handler
- the direct packet POST remains an unconditional `403` and produced no filesystem change in hostile execution
- the intake CTA now states that this public beta will not connect an intake to the page yet
- saved-option rows no longer expose raw packet action/state labels

This is not approval to unlock owner-scoped recommendations or saving, and it is not a production deployment approval.

## Exact reviewed artifacts

| Artifact | SHA-256 |
|---|---|
| `lib/squibb/public-recommendation-session-server.ts` | `2d4b5cedf58642b5f6ad24f50c80887f25e8c47f5321169523de6a4aa722c915` |
| `components/squibb/recommendation-surface.tsx` | `47c87a2822fdffbe78a2d6e3a3a991b900b4e243d31067de1dc591e1508264ad` |
| `app/api/bellows/recommendations/packet/route.ts` | `ac2b3cdf3a19080b9c6592c0b3541f3ed0e5feb21666c610c24a473a9cdbc6ab` |
| `scripts/foreman/test-matching-vpg8-surface.mjs` | `fa52cfef1d9623deb971747c285ffaa716255b021cd42cc709beb6a2b8538077` |

## G evidence

### 1. Public ON remains example-only

`lib/matching/feature-flags.ts` readback:

- `MATCHING_AUTONOMOUS_PUBLIC = true`
- `MATCHING_LLM_TRANSLATE_ENABLED = false`

`lib/squibb/public-recommendation-session-server.ts:15-33` constructs only:

- source mode `demo`
- public label `Autonomous Matching example`
- explicit account-binding explanation
- `ledger.intakes = []`
- `ledger.optionPackets = []`

`loadPublicBellowsRecommendationPageData()` at lines 41-43 returns that example for both public flag states. Public mode changes the label, not data-read permission.

### 2. Zero global/latest personal reads

The reviewed helper has no import from `recommendation-session-server` and no reference to any of:

- `loadSquibbRecommendationSessionForBellows`
- `loadBellowsPacketLedger`
- `readLatestSpeakerIntake`
- `readLatestShadowRuns`
- `readLatestSpeakerIntakeRows`
- `readLatestSquibbRecommendationPacketRows`

Static count from the reviewed helper: `0` personal-reader names.

The focused executable proof stubs only `server-only`, feature flags, and the static recommendation module. Any unexpected dependency throws. Public-OFF and public-ON executions both returned a demo source and empty ledger.

### 3. No personal or packet-path material reaches the client boundary

Bean executed the current helper against the actual `loadSquibbRecommendationSession()` static deck with public mode ON, then serialized the complete returned page-data object.

Result:

```json
{"pass":true,"source_mode":"demo","ledger":{"intakes":[],"optionPackets":[]},"serialized_bytes":23420,"forbidden_payload_absent":true}
```

The serialized object contained none of:

- `packetPath`
- `speakerEntryPath`
- `sourcePacketPath`
- `sourceSpeakerEntryPath`
- `data/squibb/`
- `foreman/speaker/entries/`
- `latest_intake`
- `PRIVATE_OWNER`

Because this safe object is the only page-data input passed into the client recommendation surface, the prior RSC-prop leakage path is closed for `/bellows/recommendations`.

### 4. All three save controls are closed before interaction

`components/squibb/recommendation-surface.tsx` evidence:

- `SAVE_CLOSED_BETA = true`
- exactly `3` controls use `disabled={SAVE_CLOSED_BETA}`
- controls are `type="button"`
- the action group is described by `squibbRecommendationSavingStatus`
- adjacent copy: `Saving is unavailable during this beta. Nothing is sent to another person or organization from these controls.`
- client `fetch(` count: `0`
- `stagePacket(` count: `0`
- packet/speaker/source path-token count: `0`
- raw `packet.action` render count: `0`
- raw `packet.state` render count: `0`

Removing the DOM `disabled` attribute cannot expose a hidden handler: none is attached to these controls.

### 5. Final truthfulness patch is coherent

The final CTA now says:

`The options below are an example. You can still complete an intake, but this public beta will not connect it to this page yet.`

The prior promise `Make these recommendations yours` and the implication that returning after intake produces a grounded personal result are absent.

The saved-option row now renders only:

`Rules score: N out of 100`

It does not render raw action or state labels. The public loader still supplies an empty option ledger, so this is defense-in-depth for any future owner-bound data.

### 6. Direct POST remains 403 with no writes

Bean transpiled and executed the current route with a stubbed `NextResponse`, taking before/after snapshots of:

- `data/squibb/recommendation-packets.jsonl`
- `data/squibb/recommendation-packets/`
- `foreman/speaker/entries/SQUIBB_OPTIONAL_PACKET_*`

Three hostile invocations were made: no request, forged valid-looking request, and a request whose JSON parser throws if called.

Result:

```json
{"pass":true,"statuses":[403,403,403],"state":"Blocked","outputs_unchanged":true}
```

The route did not parse the body, returned `state: Blocked`, and changed no packet output.

## Commands and outcomes

### Focused VPG8 proof

Command:

`node scripts/foreman/test-matching-vpg8-surface.mjs`

Outcome: `PASS`

Reported checks:

- `public_example_only_zero_personal_readers`
- `empty_public_ledger`
- `save_controls_disabled_and_no_client_post`
- `recommendation_only_rules_score`
- `shared_confidence_default_preserved`
- `page_scoped_light_dark_contrast_tokens`
- `direct_packet_post_still_403`

### TypeScript

Command:

`npm.cmd run typecheck -- --pretty false`

Outcome: `PASS`

### Legacy VPG6 full-flock proof

Command:

`node scripts/foreman/test-matching-full-flock-vpg6.mjs`

Outcome: the containment and direct-POST assertions ran successfully, then the legacy test failed at line 305 because its old internal-language regex forbids the now-approved public product name `Autonomous Matching` by matching the word `autonomous`.

This stale lexical assertion is not a containment or save failure. The direct route behavior was independently re-executed above so the G verdict does not depend on treating the legacy suite as green.

## Scope and residual boundaries

This GO proves only the local example-only recommendation read and closed save surface.

Still not approved or claimed:

- authenticated owner binding
- personal recommendation display
- save unlock
- export, correction, or deletion workflows
- LLM enablement
- production push or deployment
- unrelated dirty-tree adoption

The reviewed packet files are currently unstaged. Any later scoped staging must compare against the hashes above and must not absorb unrelated working-tree files.

## Final truthfulness recheck

After the final surface patch, Bean re-read the two changed claims and reran:

`node scripts/foreman/test-matching-vpg8-surface.mjs`

Outcome: `PASS`

Manual source counts:

- truthful public-beta non-connection statement: `1`
- stale personalized-return promise: `0`
- raw packet action references: `0`
- raw packet state references: `0`

## Final G decision

`GO - LOCAL CONTAINMENT AND SAVE-TRUTH SLICE`

`COMPLETED - BEAN G RE-REVIEW RECEIPT ONLY`
