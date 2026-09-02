RECEIVED

CUSTODY_TOKEN: CUSTODY-BEAN-C2E830105B402D60676F81162AC86152  
COUSIN: BEAN  
PACKET: TO_BEAN_VPGM_PLAID_QUESTIONNAIRE_BEAN_REDTEAM_v0.1_20260819-0627.md  
LANE_CHECK: IN_LANE — hostile questionnaire audit only; no form fill, submit, provider call, secret entry, or deploy  
BLOCKER: NONE

# Bean Plaid questionnaire red-team review

## Verdict

**PATCH_BEFORE_STAGE.** Current-state `No` answers may be prepared as a draft, but the questionnaire must not be saved as final, continued, or submitted until the exact option labels are confirmed, Q1/Q6/Q7 evidence is resolved, and the final remediation attestation remains unchecked or receives separate legal approval.

## Safest current answers

| # | Question | Safest current answer | Why / evidence needed |
|---|---|---|---|
| 1 | Security contact | Yes only with evidence; otherwise No | A designated, reachable security owner/contact must be shown. |
| 2 | Operationalized security policy | No | No ratified policy, owner, review cadence, training, or enforcement evidence. |
| 3 | Access controls | No | Least privilege and access review are not evidenced. |
| 4 | Consumer MFA before Link | No | Not implemented; a sandbox Link demo is not MFA. |
| 5 | Internal MFA | No | IdP MFA enforcement for all internal accounts is unaudited. |
| 6 | TLS 1.2+ | No unless an exact “not assessed” option exists | Intended Vercel defaults are not proof; a scan/certificate review is required for Yes. |
| 7 | Plaid-data encryption at rest | N/A if the exact option exists; otherwise No | Werkles receives no production Plaid data and has no verified Plaid-data-at-rest design. This is not a Yes. |
| 8 | Vulnerability management | No | No verified scan cadence or remediation process. |
| 9 | Privacy policy | No | No confirmed reviewed, published, operational policy. |
| 10 | Consumer consent | No | No end-to-end consent capture, record, or revocation flow. |
| 11 | Enforced retention/deletion | No | No ratified schedule, deletion mechanism, or enforcement evidence. |

## Important distinctions

- Zero Plaid production data can support `Not applicable` for Plaid-data encryption only if Plaid offers that exact choice; otherwise select `No` and explain the zero-data state if the form permits.
- Consumer MFA remains `No`: the question asks about a control before Link is shown, and that control is not implemented.
- Checking the remediation attestation would promise to remediate any Plaid-identified gap, potentially on Plaid's timeline and regardless of current scope or budget. Do not check it without legal review and an owned remediation plan.

## Three most dangerous answers

1. Q7 encryption at rest — a false Yes would attest to a control that is neither applicable to current data nor implemented.
2. Q4 consumer MFA — a false Yes would claim a protection that does not exist.
3. Final remediation attestation — it creates an open-ended future obligation.

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "custody_token": "CUSTODY-BEAN-C2E830105B402D60676F81162AC86152",
  "VERDICT": "PATCH_BEFORE_STAGE: truthful No answers are draft-safe, but final remediation attestation must remain unchecked and Q1/Q6/Q7 need evidence or exact option confirmation before any save-as-final, continue, or submit.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "exact dropdown option labels; presence of N/A choices; whether security contact evidence exists outside this packet; whether TLS scan evidence exists",
  "source_packet_id": "TO_BEAN_VPGM_PLAID_QUESTIONNAIRE_BEAN_REDTEAM_v0.1_20260819-0627",
  "source_packet_file": "TO_BEAN_VPGM_PLAID_QUESTIONNAIRE_BEAN_REDTEAM_v0.1_20260819-0627.md",
  "nextActionHash": "79e0feb64da7116d9571fbe2000fbd6689696a53c5a23fd51991b8438a3bbd8f",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a"
}
```
