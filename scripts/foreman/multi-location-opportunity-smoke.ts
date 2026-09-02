import assert from "node:assert/strict";

import { planMultiLocationOpportunityLanes } from "../../lib/opportunities/multi-location-planner";
import fs from "node:fs";
import path from "node:path";

const lanes = planMultiLocationOpportunityLanes({
  recommendationKind: "find_equipment",
  project: "landscaping company",
  participants: [
    { participantId: "owner", participantLabel: "You", city: "Atlanta", state: "GA", travelRadiusMiles: 25, locationUse: "shared_for_search" },
    { participantId: "partner", participantLabel: "Rosa", city: "Columbus", state: "GA", travelRadiusMiles: 20, locationUse: "shared_for_search" }
  ],
  specifications: ["commercial mower"]
});

assert.deepEqual(lanes.map((lane) => lane.scope), [
  "participant_local",
  "participant_local",
  "shared_meeting",
  "statewide_remote"
]);
assert.equal(lanes[0]?.locationLabel, "Atlanta, GA");
assert.equal(lanes[0]?.travelRadiusMiles, 25);
assert.equal(lanes[1]?.locationLabel, "Columbus, GA");
assert.equal(lanes[1]?.travelRadiusMiles, 20);
assert.equal(lanes[2]?.status, "requires_member_choice");
assert.equal(lanes[2]?.queries.length, 0);
assert.equal(lanes[3]?.locationLabel, "GA");
assert.match(lanes[0]?.queries[0]?.textQuery ?? "", /Atlanta, GA/);
assert.match(lanes[1]?.queries[0]?.textQuery ?? "", /Columbus, GA/);
assert.doesNotMatch(lanes[0]?.queries[0]?.textQuery ?? "", /25 mile|travel radius/);
assert.doesNotMatch(lanes[3]?.queries[0]?.textQuery ?? "", /Atlanta|Columbus/);

const privatePartner = planMultiLocationOpportunityLanes({
  recommendationKind: "get_training",
  project: "landscaping company",
  participants: [
    { participantId: "owner", participantLabel: "You", city: "Atlanta", state: "GA", locationUse: "shared_for_search" },
    { participantId: "partner", participantLabel: "Rosa", city: "Columbus", state: "GA", locationUse: "private" }
  ]
});
assert.equal(privatePartner.some((lane) => lane.locationLabel === "Columbus, GA"), false);
assert.equal(privatePartner.some((lane) => lane.scope === "shared_meeting"), false);

const mapSource = fs.readFileSync(path.join(process.cwd(), "components/opportunities/multi-location-opportunity-map.tsx"), "utf8");
assert.match(mapSource, /Source checked:/);
assert.match(mapSource, /private location is not shown to the other participant or sent to a search provider during planning/);

console.log("MULTI_LOCATION_OPPORTUNITY_SMOKE_OK");
