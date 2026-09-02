import assert from "node:assert/strict";

import { POST } from "../../app/api/opportunities/plan/route";

async function main() {
const response = await POST(new Request("http://localhost/api/opportunities/plan", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    recommendationKind: "find_equipment",
    project: "landscaping company",
    participants: [
      { participantId: "owner", participantLabel: "You", city: "Atlanta", state: "GA", travelRadiusMiles: 25, locationUse: "shared_for_search" },
      { participantId: "partner", participantLabel: "Rosa", city: "Columbus", state: "GA", locationUse: "shared_for_search" }
    ]
  })
}));

assert.equal(response.status, 200);
const body = await response.json();
assert.equal(body.liveSearchStarted, false);
assert.equal(body.lanes.length, 4);
assert.equal(body.lanes[0].locationLabel, "Atlanta, GA");
assert.equal(body.lanes[1].locationLabel, "Columbus, GA");
assert.equal(body.lanes[2].status, "requires_member_choice");

const invalid = await POST(new Request("http://localhost/api/opportunities/plan", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ recommendationKind: "find_equipment", project: "landscaping company" })
}));
assert.equal(invalid.status, 400);

console.log("MULTI_LOCATION_OPPORTUNITY_API_SMOKE_OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
