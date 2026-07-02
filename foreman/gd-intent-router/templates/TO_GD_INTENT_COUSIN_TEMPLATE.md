# To {{COUSIN_LABEL}} ({{COUSIN_PLATFORM}}): {{MISSION_CLASS_LABEL}}

## GD Intent Router

**Router:** `GD_INTENT_ROUTER_V1` · **Run:** `{{RUN_ID}}`  
**Mission class:** `{{MISSION_CLASS}}`  
**Generated:** {{GENERATED_AT}}

Ben issued an **outcome**, not a cousin list. GD routed this packet automatically.

**Stops before Send.** No auto-send. No deploy. No push. No SQL. No production actions.

---

## Mission

{{MISSION_DESCRIPTION}}

---

## Your lens ({{COUSIN_UPPER}})

{{COUSIN_LENS}}

---

## Read first

{{READ_FIRST_LIST}}

---

## Required reply

{{RESPONSE_REQUIRED_LIST}}

Save reply to `foreman/handoffs/inbox/` as:

`FROM_{{COUSIN_UPPER}}_{{MISSION_CLASS}}_{{RUN_ID}}.md`

Include the receipt token on line 2:

`GD_RECEIPT: {{RECEIPT_TOKEN}}`

---

## Relay metadata

```json
{{RELAY_METADATA_JSON}}
```
