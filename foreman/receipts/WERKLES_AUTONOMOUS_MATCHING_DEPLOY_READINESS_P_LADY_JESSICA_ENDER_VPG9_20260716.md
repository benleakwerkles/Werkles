# Werkles Autonomous Matching Deploy Readiness P - Lady Jessica / Ender VPG9

Status: `READY FOR G WITH REQUIRED CLARITY CONTRACT`
Date: `2026-07-16`
Seat: `LadyJessica@Betsy` / Ender member-language review
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch / packet starting HEAD: `maker/site-g-20260703` / `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d`
Boundary: read-only P review; no Git, browser control, deploy, alias, flag, environment, secret, database, or product-code action

## Packet readback

Read exactly these two fresh VPG9 packets before review:

1. `foreman/handoffs/outbox/TO_HEIMERDINKER_AUTONOMOUS_MATCHING_DEPLOY_READINESS_VPG9_20260716.md`
   - SHA-256: `0f3341a73b0795cb35326f5074253e7f3e3f6dfcee72e8c2de43cba54e1eef5c`
2. `foreman/handoffs/outbox/TO_LADY_JESSICA_AUTONOMOUS_MATCHING_PREVIEW_TRUTH_VPG9_20260716.md`
   - SHA-256: `4bcaef5d48cbd3938a393d1429fa3394ae6f35ed00fba781c430ff1c30420e2e`

The packets authorize status/readiness proof only. VPG8 must not be described as live at `werkles.com` before a separately approved Production deployment succeeds.

## P verdict

`GO` for a bounded G verification and gate-preparation pass if the comparison uses one fixed marker dictionary, identifies Preview and Production independently, and preserves the exact deployment boundary below.

The member-facing story should be one sentence:

> The Ready Preview shows the safer example-only recommendation page; Production is still on the earlier page, so the VPG8 protections are prepared but not live.

Do not shorten that to `Ready`, `deployed`, or `live`. Vercel `READY` is deployment health, not proof that a deployment serves Production and not proof that the VPG8 marker set is present.

## Member-facing marker contract

Use exact strings and stable boolean names. Do not store or quote response bodies.

| Boolean | Exact marker | VPG8 signature | Meaning |
|---|---|---:|---|
| `example_label_present` | `Autonomous Matching example` | `true` | The visible source is an example, not a personal result. |
| `example_boundary_present` | `This public beta uses an example. No personal recommendation is shown until it can be tied to your account.` | `true` | The reason for example-only delivery is explicit and calm. |
| `rules_score_present` | `Rules score` | `true` | The selected recommendation uses the approved rules framing. |
| `rules_score_limit_present` | `It is not a probability of success, a measure of eligibility, or a predicted outcome.` | `true` | The score cannot be read as success probability or eligibility. |
| `save_closed_message_present` | `Saving is unavailable during this beta. Nothing is sent to another person or organization from these controls.` | `true` | Saving and outward transmission are visibly closed. |
| `legacy_active_heading_present` | `Make these recommendations yours` | `false` | The removed personalization/save invitation has not returned. |

### Required interpretation patch

`Save this option` is still the label on a deliberately disabled control. Its presence does **not** mean saving is active, so it must not be used as the negative `no active save wording` marker.

For a truthful save conclusion, require both:

- `save_closed_message_present=true`; and
- `all_three_recommendation_actions_disabled=true`, derived from rendered attributes or DOM state without recording the body.

The old `Make these recommendations yours` heading is the suitable negative legacy marker because VPG8 removes it entirely.

## Preview / Production comparison contract

The comparison receipt should first identify each deployment, then present the same marker booleans in the same order.

Required identity fields for each side:

- environment: `Preview` or `Production`;
- immutable deployment id;
- deployment URL;
- source commit;
- Vercel state;
- tested route;
- HTTP status; and
- whether a protected Preview bypass was used, recorded only as a boolean with no value.

Recommended comparison shape:

| Check | Ready Preview | Current Production | Interpretation |
|---|---:|---:|---|
| deployment state is `READY` | boolean | boolean | Infrastructure health only. |
| page HTTP is `200` | boolean | boolean | Route reachability only. |
| `example_label_present` | boolean | boolean | Exact approved label. |
| `example_boundary_present` | boolean | boolean | Exact example/personal-data boundary. |
| `rules_score_present` | boolean | boolean | Exact approved score heading. |
| `rules_score_limit_present` | boolean | boolean | Exact limitation sentence. |
| `save_closed_message_present` | boolean | boolean | Exact closure explanation. |
| `legacy_active_heading_present` | boolean | boolean | Must be `false` for VPG8. |
| `all_three_recommendation_actions_disabled` | boolean | boolean | Rendered control state, not inferred from button text. |

The complete VPG8 signature is all approved positive markers `true`, the legacy marker `false`, and all three actions disabled. Production lacks the exact slice if its recorded signature differs. Report that as `VPG8 NOT YET LIVE`, not as a Production outage or failed deployment.

Do not compare arbitrary prose snippets, personal names, recommendation titles, intake answers, packet ids, response-body excerpts, or member payloads. Do not publish the protected Preview bypass.

## Empty and personal-data-safe presentation

The post-deploy smoke should add these boolean-only presentation checks:

- `empty_intake_state_present` for `No saved intakes yet.`;
- `empty_options_state_present` for `No recommendation options saved yet.`;
- `latest_intake_mode_present=false`; and
- `packet_id_marker_present=false`.

These support the example-only claim without printing a body. They do not prove authenticated cross-member isolation, export, deletion, or retention; those remain outside VPG9.

## Exact deployment target and blast radius

The Tier 1 gate must bind approval to one immutable Ready Preview deployment and its source SHA. `branch HEAD`, `latest Preview`, and `deploy VPG8` are not exact enough because the status/readiness receipts can advance the branch without changing the product.

The gate should distinguish:

- VPG8 product commit: `58b8938877ae216fd308173a92e0a5da66971d0c`;
- packet starting branch tip: `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d`; and
- exact deployment target: the live-inspected Ready Preview id, URL, and source commit chosen for promotion/deploy.

Member-visible blast radius:

- `/bellows/recommendations`: example-only delivery, empty activity presentation, disabled saving, Rules score truth, readable copy and contrast;
- `/bellows/recommendations/test-case-0`: shared gate heading/reviewer language only; and
- `/api/bellows/recommendations/packet`: remains closed with `403`.

Explicit non-blast-radius claims:

- no Matching engine or ranking rule change;
- no intake, recommendation, or shadow-run write;
- no SQL or schema change;
- no public/LLM/storage-mode change;
- no authentication or ownership system added; and
- no external introduction, purchase, money movement, or provider action.

## Post-deploy smoke contract

Run only after a new, exact Production approval and deployment. Stop and roll back on any failed invariant.

1. Inspect the promoted/deployed Production target and record exact deployment id, URL, source commit, `READY` state, and `werkles.com` alias attachment.
2. GET `https://werkles.com/bellows/recommendations`; require HTTP `200`. Store only status and booleans.
3. Require the complete VPG8 marker signature defined above.
4. Require both empty-state booleans, `latest_intake_mode_present=false`, and `packet_id_marker_present=false`.
5. Require `all_three_recommendation_actions_disabled=true`; do not infer this from `Save this option` text.
6. POST no member payload to `/api/bellows/recommendations/packet`; require `403`. Record status only and do not store the response body. Source already shows this handler has no write path.
7. GET `/operator/matching/shadow` without an internal-preview bridge; require `404` from the Production internal-route boundary and record status only.
8. Reconfirm the deployed source has public Matching `ON`, LLM translation `OFF`, and the existing storage mode unchanged. Record flag names and states only; do not print secret or environment values.
9. Confirm no intake submission, recommendation-save success, shadow-run creation, SQL, schema, alias beyond the approved Production target, or unrelated mutation occurred during smoke.

The smoke receipt should end in one of two exact outcomes:

- `PASS - VPG8 LIVE ON THE IDENTIFIED PRODUCTION DEPLOYMENT`; or
- `FAIL - ROLLBACK TO THE IDENTIFIED PREDEPLOY PRODUCTION DEPLOYMENT`.

## Rollback clarity

Before approval, live-inspect and record the exact currently Ready Production deployment id and URL. That verified deployment, not a historical receipt, generic `previous deployment`, or branch name, is the rollback target.

On any failed smoke invariant:

1. promote/re-alias the recorded predeploy Production deployment;
2. confirm `werkles.com` resolves to that exact deployment id;
3. repeat the page GET, internal-route denial, and public-ON / LLM-OFF checks; and
4. write a rollback receipt that identifies both the rejected deployment and restored deployment.

Do not run write-producing Matching scenarios as rollback proof.

## Human-gate phrase

The final gate should substitute the exact inspected target deployment id into one phrase and accept no shorthand:

```text
APPROVE AUTONOMOUS MATCHING VPG8 DEPLOY TO WERKLES.COM - <EXACT_READY_PREVIEW_DEPLOYMENT_ID>
```

The approval must preserve public Matching `ON`, LLM translation `OFF`, and storage mode unchanged. `V, P, G.`, `go`, `deploy`, or `approve rollout` alone must not satisfy this Production gate.

## Evidence boundary

This P pull reviewed the two packets and current local source markers only. It did not inspect Vercel, issue requests, authenticate to Preview, control a browser, verify live Preview/Production state, deploy, or mutate Production. Deployment ids, URLs, Ready states, HTTP results, marker booleans, and the rollback target remain G evidence to collect.

The sole write from this review is this receipt.

COMPLETED
