#!/usr/bin/env node
/**
 * Handeye red-team attack against owner-bound Bellows + ghost matching.
 *
 * Per ghost it asserts:
 *   1. intake accepted and an owner cookie is minted
 *   2. the readout is that ghost's own text (not the bakery demo)
 *   3. a cookieless caller gets the empty state, never someone's intake
 *   4. cross-owner: the previous ghost's cookie never shows this ghost's need
 *   5. a forged owner cookie returns empty, not a real session
 *   6. ranked candidates carry visible reasons and exclude blocked members
 *
 * Usage: node scripts/foreman/ghost-fleet-handeye-attack.mjs [baseUrl] [limit]
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/* Accepts both `<base> <limit>` and `--base <url> --count <n>`. Passing a flag
   form previously made `limit` NaN, which sliced the fleet to zero members and
   printed pass:0 fail:0 with a success exit code — a suite that tested nothing
   reporting that nothing was wrong. */
function parseArgs(argv) {
  const out = { base: "http://127.0.0.1:3000", limit: 20 };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base") out.base = argv[++i];
    else if (arg === "--count" || arg === "--limit") out.limit = Number(argv[++i]);
    else positional.push(arg);
  }
  if (positional[0]) out.base = positional[0];
  if (positional[1]) out.limit = Number(positional[1]);
  if (!Number.isFinite(out.limit) || out.limit < 1) {
    console.error(`FATAL: unusable case count (${out.limit}). Refusing to run an empty suite.`);
    process.exit(2);
  }
  return out;
}

const { base: rawBase, limit } = parseArgs(process.argv.slice(2));
const base = rawBase.replace(/\/$/, "");
const root = process.cwd();

const fleet = JSON.parse(await readFile(path.join(root, "data/ghost-fleet/members.json"), "utf8"));
const members = fleet.members.slice(0, limit);
if (members.length === 0) {
  console.error("FATAL: zero ghosts selected. An empty suite must not report success.");
  process.exit(2);
}
const blockedIds = new Set(
  fleet.members.filter((m) => m.introEligibility === "blocked").map((m) => m.id)
);

function cookieJar() {
  const jar = new Map();
  return {
    store(res) {
      const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
      for (const c of raw) {
        const [nv] = c.split(";");
        const i = nv.indexOf("=");
        if (i > 0) jar.set(nv.slice(0, i), nv.slice(i + 1));
      }
    },
    header() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    hasOwner() {
      return jar.has("werkles_bellows_owner");
    }
  };
}

/* Public fleet copy can legitimately appear in another owner's ranked
   candidates, and several generated members share the same opening sentence.
   Use a per-run private intake canary so cross-owner checks detect only leaked
   owner input, never an expected candidate description. */
const runNonce = randomUUID();

function fingerprint(member) {
  return `HANDEYE-${runNonce}-${member.id}`;
}

const results = [];
let pass = 0;
let fail = 0;
let previous = null;

for (const member of members) {
  const jar = cookieJar();
  const failures = [];
  const answers = {
    heaviest_lift: `${member.statedNeed}\n${fingerprint(member)}`,
    business_stage: "Working on it now and deciding what comes next.",
    already_tried: member.alreadyTried,
    time_cost: member.timeCost,
    stuck_decision: member.stuckDecision,
    success_twelve_months: member.successTwelveMonths,
    resources_on_hand: [...member.skills, ...member.offers].join("; "),
    what_you_offer: member.offers.join("; "),
    constraints: `This needs to work in ${member.city}, ${member.region}.`
  };

  const post = await fetch(`${base}/api/bellows/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-werkles-handeye": "1" },
    body: JSON.stringify({ answers })
  });
  jar.store(post);
  const body = await post.json().catch(() => ({}));

  if (post.status !== 200) failures.push(`intake status ${post.status}`);
  if (!jar.hasOwner()) failures.push("no owner cookie minted");
  if (body.testRun === false) failures.push("handeye intake was not marked as a test run");

  /* 2. Own readout. */
  const rec = await fetch(`${base}/bellows/recommendations`, { headers: { Cookie: jar.header() } });
  const html = await rec.text();
  const mine = html.includes(fingerprint(member));
  if (!mine) failures.push("own intake text missing from personal readout");
  if (html.includes("Autonomous Matching example") && html.includes("bakery") && !mine) {
    failures.push("bakery demo served instead of personal readout");
  }

  /* 3. Cookieless caller. */
  const unbound = await fetch(`${base}/bellows/recommendations`);
  const unboundHtml = await unbound.text();
  if (unboundHtml.includes(fingerprint(member))) failures.push("LEAK: cookieless caller saw this intake");

  /* 4. Cross-owner isolation against the previous ghost's session. */
  let crossOwnerClean = null;
  if (previous) {
    const cross = await fetch(`${base}/bellows/recommendations`, {
      headers: { Cookie: previous.cookie }
    });
    const crossHtml = await cross.text();
    crossOwnerClean = !crossHtml.includes(fingerprint(member));
    if (!crossOwnerClean) failures.push(`LEAK: ${previous.ghostId} session saw ${member.id} intake`);
  }

  /* 5. Forged owner cookie must not resolve to anyone. */
  const forged = await fetch(`${base}/bellows/recommendations`, {
    headers: { Cookie: `werkles_bellows_owner=${randomUUID()}` }
  });
  const forgedHtml = await forged.text();
  if (forgedHtml.includes(fingerprint(member))) failures.push("LEAK: forged cookie saw this intake");

  /* 6. Ranked candidates: real reasons, no blocked members, capped scores. */
  const introRes = await fetch(`${base}/api/ghost-fleet/intros`, { headers: { Cookie: jar.header() } });
  const intro = await introRes.json().catch(() => ({}));
  const candidates = intro?.result?.candidates ?? [];
  const reasoned = candidates.every((c) => Array.isArray(c.reasons) && c.reasons.length > 0);
  const noBlocked = candidates.every((c) => !blockedIds.has(c.ghostId));
  const noSelfMatch = candidates.every((c) => c.ghostId !== member.id || c.score < 100);
  const scoreSane = candidates.every((c) => c.score > 0 && c.score <= 92);
  const ranksOrdered = candidates.every((c, i) => c.rank === i + 1);

  if (introRes.status !== 200) failures.push(`intros status ${introRes.status}`);
  if (candidates.length === 0) failures.push("no ranked candidates for a fully answered intake");
  if (!reasoned) failures.push("a candidate was returned with no visible reason");
  if (!noBlocked) failures.push("a blocked member was offered as a candidate");
  if (!scoreSane) failures.push("score outside the honest 1-92 band");
  if (!ranksOrdered) failures.push("candidate ranks not sequential");
  if (!noSelfMatch) failures.push("self-match scored as certain");

  /* 7. Workshop / Proof / Dues must be bound to this owner and leak nobody else. */
  const workshop = await fetch(`${base}/dashboard/blueprints`, { headers: { Cookie: jar.header() } });
  const workshopHtml = await workshop.text();
  if (!workshopHtml.includes(fingerprint(member))) failures.push("workshop did not show this owner's intake");

  const proof = await fetch(`${base}/dashboard/crucible`, { headers: { Cookie: jar.header() } });
  const proofHtml = await proof.text();
  if (!proofHtml.includes("Identity check")) failures.push("proof surface listed no owner check");

  const duesRes = await fetch(`${base}/api/owner/state`, { headers: { Cookie: jar.header() } });
  const dues = await duesRes.json().catch(() => ({}));
  if (dues?.state?.hasIntake !== true) failures.push("dues state did not see this owner's intake");
  if (!Array.isArray(dues?.state?.duesDoNotChange) || dues.state.duesDoNotChange.length === 0) {
    failures.push("dues state dropped its no-guarantee language");
  }

  const unboundWorkshop = await fetch(`${base}/dashboard/blueprints`);
  const unboundWorkshopHtml = await unboundWorkshop.text();
  if (unboundWorkshopHtml.includes(fingerprint(member))) {
    failures.push("LEAK: cookieless workshop showed this intake");
  }

  const unboundState = await fetch(`${base}/api/owner/state`);
  const unboundStateJson = await unboundState.json().catch(() => ({}));
  if (unboundStateJson?.state?.hasIntake !== false) failures.push("LEAK: cookieless owner state claimed an intake");

  /* 8. Recommendation View must obey FROM_MAKER_RECOMMENDATION_VIEW_V1:
        one verdict, strength bands instead of a score, no numeric fit on the page. */
  const recRes = await fetch(`${base}/api/recommendation-view`, { headers: { Cookie: jar.header() } });
  const recView = (await recRes.json().catch(() => ({})))?.view;
  if (!recView) failures.push("recommendation view returned nothing for this owner");
  if (recView && recView.state === "no_intake") failures.push("recommendation view lost this owner's intake");
  if (recView && typeof recView.recommendation?.verdict !== "string") failures.push("recommendation view had no verdict");
  if (recView && !/^Next move:/.test(recView.recommendation?.verdict || "")) {
    failures.push(`verdict not phrased as a next move: ${recView.recommendation?.verdict}`);
  }
  const recBlob = JSON.stringify(recView ?? {});
  if (/"score"\s*:/.test(recBlob) || /\bfit \d+/.test(recBlob)) {
    failures.push("SPEC: numeric match score leaked into the recommendation view");
  }
  const bands = new Set(["Strong", "Medium", "Slim", "CountsAgainst"]);
  const badBand = (recView?.visibleReasons || []).find((r) => !bands.has(r.strength));
  if (badBand) failures.push(`reason strength not a band: ${badBand.strength}`);

  /* Coherence assertions added from the CBCC red team of 2026-08-03. Each one
     encodes a defect three cousins caught by reading, which the previous suite
     passed clean: the tests checked that fields were populated, not that the
     populated fields agreed with each other. */

  /* Ender: the page argued its strongest evidence for a named individual, showed
     no door, then argued against that individual's entire lane. */
  if (recView && (recView.doors || []).length === 0) {
    const named = (recView.visibleReasons || []).filter((r) => /\b[A-Z][a-z]+ [A-Z]\./.test(r.saw || ""));
    if (named.length > 0) {
      failures.push(`COHERENCE: reasons name a member (${named[0].saw.slice(0, 40)}) while no door is shown`);
    }
  }

  /* No "why it matters" line may assert a frequency, a count, or a superlative
     that nothing on the page computed. */
  const fabricated = (recView?.visibleReasons || []).find((r) =>
    /\b(rarest|most common|majority|typically \d|usually \d|\d+% of)\b/i.test(r.matters || "")
  );
  if (fabricated) failures.push(`FABRICATION: unearned claim in a reason: ${fabricated.matters.slice(0, 60)}`);

  /* A heading that promises doors must not be paid with an empty list. */
  if (recView && (recView.doors || []).length === 0 && /doors this points at/i.test(recView.doorsHeading || "")) {
    failures.push("COHERENCE: doors heading promised doors and delivered none");
  }

  /* Every surface state must offer at least one action a member can actually take. */
  const actionable = [recView?.recommendation?.primaryAction, ...(recView?.recommendation?.secondaryActions || [])]
    .filter(Boolean)
    .some((a) => a.enabled);
  if (recView && !actionable) failures.push("DEAD END: no enabled action anywhere in the recommendation");

  /* The retired three-tier confidence word must not reappear in member-facing copy. */
  if (/Read confidence:/.test(recBlob)) failures.push("COPY: retired confidence label leaked back into the view");

  /* Nulls must not render as words. */
  if (recView?.askedFor?.arena === "Unnamed" || /"arena"\s*:\s*"(Unsure|Unnamed|null)"/.test(recBlob)) {
    failures.push("COPY: empty schema field rendered as a word");
  }
  if (recView && (recView.visibleReasons || []).length === 0) failures.push("recommendation view showed no visible reasons");
  if (recView && recView.recommendation?.secondaryActions?.some((a) => a.kind === "request_intro" && a.enabled)) {
    failures.push("intro knock was enabled while every member is unverified");
  }

  const introsHtml = await (await fetch(`${base}/dashboard/intros`, { headers: { Cookie: jar.header() } })).text();
  if (/\bfit \d+/.test(introsHtml)) failures.push("SPEC: 'fit N' rendered on the intros page");
  if (!introsHtml.includes("Next move:")) failures.push("intros page rendered no verdict");
  if (!introsHtml.includes("What this is based on")) failures.push("intros page rendered no visible-reason rail");
  if (!introsHtml.includes("Why not the alternatives")) failures.push("intros page rendered no rejected alternatives");
  if ((introsHtml.match(/Next move:/g) || []).length > 2) {
    failures.push("SPEC: more than one recommendation on the page");
  }
  /* Verdict must precede the receipt in source order: a reader should not have to
     scroll past his own words being read back to him to reach the answer. */
  const verdictAt = introsHtml.indexOf("Next move:");
  const receiptAt = introsHtml.indexOf("What you asked for");
  if (verdictAt > -1 && receiptAt > -1 && receiptAt < verdictAt) {
    failures.push("ORDER: the receipt rendered above the verdict");
  }
  /* Internal vocabulary must not reach a member. */
  const jargon = ["Sharpen the Workshop", "Proof posture", "Strengthen the Foundry record"].find((w) =>
    introsHtml.includes(w)
  );
  if (jargon) failures.push(`COPY: internal vocabulary rendered to a member: ${jargon}`);

  const unboundIntros = await (await fetch(`${base}/dashboard/intros`)).text();
  if (unboundIntros.includes(fingerprint(member))) failures.push("LEAK: cookieless intros showed this intake");

  if (previous) {
    const crossWorkshop = await fetch(`${base}/dashboard/blueprints`, {
      headers: { Cookie: previous.cookie }
    });
    const crossWorkshopHtml = await crossWorkshop.text();
    if (crossWorkshopHtml.includes(fingerprint(member))) {
      failures.push(`LEAK: ${previous.ghostId} workshop showed ${member.id} intake`);
    }
  }

  const ok = failures.length === 0;
  if (ok) pass += 1;
  else fail += 1;

  results.push({
    ghostId: member.id,
    displayName: member.displayName,
    handeyeSeat: member.handeyeSeat,
    postStatus: post.status,
    testRun: body.testRun ?? null,
    ownerCookie: jar.hasOwner(),
    mine,
    crossOwnerClean,
    candidateCount: candidates.length,
    topScore: candidates[0]?.score ?? null,
    topReasons: candidates[0]?.reasons?.map((r) => r.label) ?? [],
    ok,
    failures
  });

  previous = { ghostId: member.id, cookie: jar.header() };
}

const receiptDir = path.join(root, "foreman/receipts");
await mkdir(receiptDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const receiptPath = path.join(receiptDir, `WERKLES_GHOST_FLEET_HANDEYE_REDTEAM_${stamp}.json`);
const summary = {
  base,
  limit,
  pass,
  fail,
  fleetCount: fleet.members.length,
  blockedInFleet: blockedIds.size,
  distinctTopScores: new Set(results.map((r) => r.topScore)).size,
  results
};
await writeFile(receiptPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    { pass, fail, distinctTopScores: summary.distinctTopScores, receiptPath },
    null,
    2
  )
);
if (fail > 0) process.exit(1);
