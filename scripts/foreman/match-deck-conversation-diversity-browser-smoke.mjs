import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await context.addCookies([{ name: "werkles_bellows_owner", value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384", url: "http://127.0.0.1:3000" }]);
  await page.goto("http://127.0.0.1:3000/dashboard/intros", { waitUntil: "load" });
  await page.getByRole("heading", { name: /useful possibilit/i }).waitFor();
  const choices = page.locator(".ghost-member-lab__person");
  const count = await choices.count();
  assert.ok(count >= 2 && count <= 3);

  const names = [];
  const contributionSignatures = [];
  const questionSets = [];
  const answerSets = [];
  for (let candidate = 0; candidate < count; candidate += 1) {
    await choices.nth(candidate).click();
    names.push((await page.locator(".ghost-member-lab__profile h3").innerText()).trim());
    contributionSignatures.push((await page.locator(".ghost-member-lab__profile dl").innerText()).trim());
    const questions = page.locator(".ghost-member-lab__questions button");
    questionSets.push((await questions.allTextContents()).join("|"));
    const answers = [];
    for (let question = 0; question < await questions.count(); question += 1) {
      await questions.nth(question).click();
      answers.push((await page.locator(".ghost-member-lab__exchange").last().locator("p").last().innerText()).trim());
    }
    answerSets.push(answers.join("|"));
    await page.getByRole("button", { name: "Reset practice conversation" }).click();
  }

  assert.equal(new Set(names).size, count);
  assert.equal(new Set(contributionSignatures).size, count, "cloned offer/ask archetypes must not pad the deck");
  assert.equal(new Set(questionSets).size, count, "candidate question sets must differ");
  assert.equal(new Set(answerSets).size, count, "candidate answer sets must differ");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "conversation deck must fit 390px");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log(`PASS ${count} honest profiles with distinct contribution and 4-answer conversation sets: ${names.join(" / ")}`);
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 9000));
  throw error;
} finally {
  await browser.close();
}
