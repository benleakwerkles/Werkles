import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { accountSelectionTruthFor } from "../../lib/crucible-account-selection-truth.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const funds = accountSelectionTruthFor("funds");

assert.ok(funds);
assert.equal(accountSelectionTruthFor("funds_reverification"), null);
assert.equal(accountSelectionTruthFor("identity"), null);
assert.match(funds.body, /"Financial accounts" is Plaid Link's display term/);
assert.match(funds.body, /choose from the eligible accounts Link shows/);
assert.match(funds.body, /Only accounts you select would be considered/);
assert.match(funds.body, /Finishing Link alone creates no funds proof or receipt/);
assert.ok(funds.body.length < 230, "account-selection truth should stay compact");
assert.doesNotMatch(funds.body, /all (?:of )?(?:your )?accounts/i);
assert.doesNotMatch(funds.body, /checking|savings|investment|credit|depository/i);

const card = await readFile(
  path.join(repoRoot, "components/crucible/verification-card.tsx"),
  "utf8"
);
const truthPosition = card.indexOf("verification-account-selection-truth");
const buttonPosition = card.indexOf("<button", truthPosition);
assert.ok(truthPosition > -1, "Funds account-selection truth must render");
assert.ok(buttonPosition > truthPosition, "Account-selection truth must appear immediately before the action");
assert.match(card, /aria-label="Plaid account selection"/);

console.log("Crucible account-selection truth contract: PASS");
