import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
page.setDefaultTimeout(20_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

const empty = (id, label) => ({ id, label, emptyMessage: "Not yet written by both people.", rows: [] });
const storedBrief = {
  version: 1,
  candidateId: "ghost_095",
  savedAt: new Date().toISOString(),
  brief: {
    version: 1,
    formationId: "m11-browser-smoke",
    title: "Werkle Operating Brief",
    browserLocal: true,
    boundaryCopy: "Accepted wording only. Practice summary; not an agreement.",
    sourceRevisionKey: "m11-accepted-row-2",
    updatedAt: new Date().toISOString(),
    sections: [
      empty("purpose_customer_test", "Purpose / Customer / Test"),
      {
        id: "roles_decisions",
        label: "Who Does What",
        emptyMessage: "Not yet written by both people.",
        rows: [{
          topicId: "roles",
          label: "Responsibilities",
          text: "You will run two customer calls; Imani will map the handoff and record where it fails.",
          revision: 2,
          sourceTrail: ["Your Workshop · self-reported", "Imani · generated practice profile"],
          adviserReview: false
        }]
      },
      empty("contributions_financial_proof", "Contributions / Shared Wording"),
      empty("ip_confidentiality", "What We Said About Ideas & Privacy"),
      empty("exit_unknowns", "Pause / Exit / Open Unknowns")
    ]
  }
};

try {
  await page.goto("http://127.0.0.1:3000/bellows/library", { waitUntil: "load" });
  await page.evaluate((brief) => {
    window.localStorage.setItem("werkles:werkle:operating-brief:v1", JSON.stringify(brief));
  }, storedBrief);

  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "networkidle" });
  const settled = page.locator(".bellows-draft-shelf__accepted-work");
  await settled.waitFor();
  await settled.locator("summary").click();
  await settled.getByText("Only current wording both people accepted appears here.").waitFor();
  await settled.getByText(storedBrief.brief.sections[1].rows[0].text).waitFor();
  assert.equal(await settled.getByText("Read together before deciding more").count(), 5);
  assert.equal(await settled.getByRole("link", { name: /U.S. Small Business Administration/ }).count() >= 1, true);
  assert.equal(await settled.getByRole("link", { name: /Internal Revenue Service/ }).count(), 1);
  assert.equal(await settled.getByRole("link", { name: /Federal Trade Commission/ }).count(), 1);
  await settled.getByText("Public-source links checked August 23, 2026. A link is a starting point, not an endorsement or a decision.").waitFor();

  await page.goto("http://127.0.0.1:3000/bellows/personal/partnership-alignment", { waitUntil: "networkidle" });
  const acceptedContext = page.locator(".alignment-workbook__accepted-context");
  await acceptedContext.waitFor();
  await acceptedContext.getByText("Start the conversation from what both people actually wrote.").waitFor();
  await acceptedContext.getByText(storedBrief.brief.sections[1].rows[0].text).waitFor();
  assert.equal(await page.getByLabel("1. Purpose").inputValue(), "", "accepted shared wording must not fill the private memo");

  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS BVPGM M11: accepted Formation wording returns through Personal Bellows and the private memo without copying private predictions or filling answers.");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_URL", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 9000));
  throw error;
} finally {
  await browser.close();
}
