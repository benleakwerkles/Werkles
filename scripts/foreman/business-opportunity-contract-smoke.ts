import assert from "node:assert/strict";

import { opportunityCandidateSafetyErrors } from "../../lib/opportunities/candidate-safety";
import { planBusinessOpportunityQueries } from "../../lib/opportunities/query-planner";
import { OPPORTUNITY_PROVIDER_CATALOG } from "../../lib/opportunities/provider-catalog";
import { DECATUR_LANDSCAPING_WALKTHROUGH } from "../../lib/opportunities/walkthrough-fixtures";
import type { BusinessOpportunityCandidate } from "../../lib/opportunities/types";
import fs from "node:fs";
import path from "node:path";

const queries = planBusinessOpportunityQueries({
  recommendationKind: "find_equipment",
  project: "landscaping company",
  city: "Decatur",
  state: "GA",
  budgetText: "$15,000",
  specifications: ["commercial electric mower", "equipment rental"]
});

assert.equal(queries[0]?.category, "supplier_equipment");
assert.match(queries[0]?.textQuery ?? "", /landscaping company/i);
assert.match(queries[0]?.textQuery ?? "", /Decatur, GA/i);
assert.doesNotMatch(queries[0]?.textQuery ?? "", /\$15,000/);
assert.equal(OPPORTUNITY_PROVIDER_CATALOG.google_places.stage, "live_api_ready");
assert.equal(OPPORTUNITY_PROVIDER_CATALOG.sba_lender_match.stage, "official_outbound");
assert.equal(OPPORTUNITY_PROVIDER_CATALOG.commercial_space_feed.stage, "not_connected");

const safeCandidate: BusinessOpportunityCandidate = {
  id: "fixture:supplier:1",
  category: "supplier_equipment",
  name: "Example Landscape Supply",
  locationLabel: "Decatur, GA",
  sourceName: "Walkthrough fixture",
  sourceUrl: "https://example.com/source",
  sourceRecordId: "fixture-1",
  providerStage: "walkthrough_fixture",
  observedAt: "2026-09-01T12:00:00.000Z",
  facts: [{ label: "Category", value: "Landscape supply", provenance: "provider" }],
  whyItAppeared: ["You asked to compare equipment and supply paths near Decatur."],
  unknowns: ["Current stock, delivered price, warranty, and account terms are unknown."],
  sponsorship: { status: "none", disclosure: "Werkles is not paid for this walkthrough fixture.", affectedOrdering: false },
  action: { label: "Open source", href: "https://example.com/source", sendsMemberData: false, createsCommitment: false }
};

assert.deepEqual(opportunityCandidateSafetyErrors(safeCandidate), []);
assert.match(
  opportunityCandidateSafetyErrors({ ...safeCandidate, whyItAppeared: ["This is the best supplier and within your budget."] }).join(" "),
  /Unsupported promotional or eligibility claim/
);
assert.match(
  opportunityCandidateSafetyErrors({ ...safeCandidate, sourceUrl: "http://example.com" }).join(" "),
  /Source URL must be HTTPS/
);

assert.equal(DECATUR_LANDSCAPING_WALKTHROUGH.length, 5);
for (const item of DECATUR_LANDSCAPING_WALKTHROUGH) {
  assert.deepEqual(opportunityCandidateSafetyErrors(item), [], `${item.name} must satisfy the candidate contract`);
  assert.equal(item.providerStage, "walkthrough_fixture");
  assert.equal(item.sponsorship.affectedOrdering, false);
  assert.equal(item.action.sendsMemberData, false);
  assert.equal(item.action.createsCommitment, false);
}

const finderSource = fs.readFileSync(path.join(process.cwd(), "components/opportunities/business-opportunity-finder.tsx"), "utf8");
assert.match(finderSource, /fit and availability not verified by Werkles/);
assert.match(finderSource, /Opening the source sends none of your Intake answers/);

console.log("BUSINESS_OPPORTUNITY_CONTRACT_SMOKE_OK");
