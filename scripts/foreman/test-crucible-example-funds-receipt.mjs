import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { exampleFundsReceipt } from "../../lib/crucible-example-funds-receipt.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

assert.match(exampleFundsReceipt.title, /fictional private/i);
assert.match(exampleFundsReceipt.disclaimer, /Both people would have to consent/i);
assert.match(exampleFundsReceipt.disclaimer, /example only/i);
assert.match(exampleFundsReceipt.disclaimer, /Not this member/);
assert.match(exampleFundsReceipt.disclaimer, /Not live/);
assert.match(exampleFundsReceipt.disclaimer, /No provider call was made/);
assert.match(exampleFundsReceipt.disclaimer, /does not currently produce this receipt/);

assert.deepEqual(
  exampleFundsReceipt.fields.map((field) => field.key),
  ["claim", "reviewed_scope", "observed_date", "expiry", "example_result", "limitations"]
);
assert.equal(exampleFundsReceipt.fields.length, 6);

const serialized = JSON.stringify(exampleFundsReceipt);
for (const forbidden of [
  /plaid/i,
  /sandbox|production|development/i,
  /institution/i,
  /account number|routing number|mask/i,
  /exact balance|current balance|available balance/i,
  /credential|password/i,
  /access.?token|public.?token|item.?id/i
]) {
  assert.doesNotMatch(serialized, forbidden);
}

for (const field of exampleFundsReceipt.fields) {
  assert.ok(field.value.length < 100, `${field.key} should remain compact`);
}

const card = await readFile(
  path.join(repoRoot, "components/crucible/verification-card.tsx"),
  "utf8"
);
assert.match(card, /check\.key === "funds"/);
assert.match(card, /<figure className="verification-example-receipt"/);
assert.match(card, /aria-labelledby="fictional-funds-receipt-title"/);
assert.match(card, /<p role="note">\{exampleFundsReceipt\.disclaimer\}<\/p>/);
assert.match(card, /<details>/);
assert.match(card, /<summary>View the six-field fictional example<\/summary>/);
assert.match(card, /exampleFundsReceipt\.fields\.map/);

const warningPosition = card.indexOf('<p role="note">{exampleFundsReceipt.disclaimer}</p>');
const detailsPosition = card.indexOf("<details>", warningPosition);
const fieldsPosition = card.indexOf("exampleFundsReceipt.fields.map", detailsPosition);
const detailsClosePosition = card.indexOf("</details>", fieldsPosition);
assert.ok(warningPosition > -1 && warningPosition < detailsPosition, "warning must stay visible before disclosure");
assert.ok(
  detailsPosition < fieldsPosition && fieldsPosition < detailsClosePosition,
  "all six fields must remain inside the collapsed native disclosure"
);
assert.doesNotMatch(card, /<details\s+open/);

console.log("Crucible fictional funds receipt contract: PASS");
