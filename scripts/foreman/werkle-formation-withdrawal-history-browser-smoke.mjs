import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await context.addCookies([{
    name: "werkles_bellows_owner",
    value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
    url: "http://127.0.0.1:3000"
  }]);
  await page.goto("http://127.0.0.1:3000/dashboard/werkles/formation?candidate=ghost_095", { waitUntil: "load" });
  await page.evaluate(() => {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("werkles:formation:")) window.localStorage.removeItem(key);
    }
  });
  await page.reload({ waitUntil: "load" });

  const shared = page.locator(".werkle-merge-canvas__shared");
  await shared.getByRole("button", { name: "Write this together", exact: true }).click();
  await shared.getByRole("button", { name: "Take back my pending answer", exact: true }).click();
  assert.match(await shared.innerText(), /YOU\s+No answer yet/i, "withdrawal should return the current actor to no pending answer");

  await shared.getByRole("button", { name: "Use your wording", exact: true }).click();
  const note = shared.getByPlaceholder("Say what is unresolved, what information would help, or what boundary cannot be crossed.");
  await note.fill("I need the purpose to remain narrow until the first customer test is complete.");
  await note.press("Tab");

  await page.getByRole("button", { name: /Enter .*generated practice answer/ }).click();
  await shared.getByRole("button", { name: "Use their wording", exact: true }).click();
  await page.getByText("This exact result crossed the line", { exact: true }).waitFor();

  const history = page.locator(".werkle-history");
  await history.getByText("Took back a pending answer before mutual acceptance.", { exact: true }).waitFor();
  await history.getByText("I need the purpose to remain narrow until the first customer test is complete.", { exact: true }).waitFor();

  await page.reload({ waitUntil: "load" });
  await page.locator(".werkle-history").getByText("I need the purpose to remain narrow until the first customer test is complete.", { exact: true }).waitFor();
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);

  console.log("PASS Werkle formation withdrawal and objection-history browser walk");
} finally {
  await browser.close();
}
