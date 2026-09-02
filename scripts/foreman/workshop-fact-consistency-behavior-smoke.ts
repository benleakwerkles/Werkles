import assert from "node:assert/strict";

import { describeWorkshopPressure } from "../../lib/owner-surfaces/workshop-pressure";

assert.equal(
  describeWorkshopPressure(""),
  "Your intake does not name what is getting in the way yet."
);
assert.equal(
  describeWorkshopPressure(" ;  ; "),
  "Your intake does not name what is getting in the way yet."
);
assert.equal(
  describeWorkshopPressure("Customers or sales"),
  "You named Customers or sales as something getting in the way."
);
assert.equal(
  describeWorkshopPressure("Customers or sales; Tools, equipment, or space"),
  "You named multiple things getting in the way: Customers or sales, and Tools, equipment, or space. We should not pick one as the main bottleneck yet."
);
assert.equal(
  describeWorkshopPressure("Money; Time; Customers"),
  "You named multiple things getting in the way: Money, Time, and Customers. We should not pick one as the main bottleneck yet."
);

console.log("Workshop fact consistency behavior: PASS");
