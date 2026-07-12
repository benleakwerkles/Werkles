#!/usr/bin/env node
"use strict";

/**
 * Werkles matching shadow smoke — POST discovery intakes, verify shadow_run_id.
 * No secrets printed.
 */

const stamp = Date.now();

const SCENARIOS = [
  {
    name: "capital_partner",
    label: "Capital + partner (symptom trap)",
    body: {
      name: `Shadow QA Capital ${stamp}`,
      contact: `shadow-capital-${stamp}@werkles.com`,
      situation:
        "I have a food truck idea and need an investor and a business partner before I can buy the truck and start.",
      goal: "Raise $80k and find a co-founder in the next 90 days.",
      why_now: "Lease opportunity expires soon.",
      assets: ["Idea", "Skills", "Time"],
      stated_blocker: "No capital and no partner with restaurant experience.",
      tried: "Talked to two friends; neither committed.",
      constraints: "Still working full time; limited savings.",
      one_thing: "I need money and a partner.",
      lane: "Builder",
      response_speed: "ASAP",
      notes: "Matching shadow mule — capital+partner scenario."
    }
  },
  {
    name: "job_change",
    label: "Employment / job change",
    body: {
      name: `Shadow QA Job ${stamp}`,
      contact: `shadow-job-${stamp}@werkles.com`,
      situation: "Bartending shifts are inconsistent and I want a better kitchen job with benefits.",
      goal: "Land a line cook or prep role with stable hours within 60 days.",
      why_now: "Rent went up; need predictable income.",
      assets: ["Skills", "Time"],
      stated_blocker: "No connections in better restaurants.",
      tried: "Applied online to twelve places; two callbacks, no offers.",
      constraints: "Cannot relocate; need evenings free twice a week.",
      one_thing: "I need a better job.",
      lane: "Spark",
      response_speed: "Few days",
      notes: "Matching shadow mule — job scenario."
    }
  },
  {
    name: "training_not_partner",
    label: "Partner language but training gap",
    body: {
      name: `Shadow QA Training ${stamp}`,
      contact: `shadow-training-${stamp}@werkles.com`,
      situation:
        "I want to start a landscaping crew but I do not have a license and I am not confident estimating jobs.",
      goal: "Run a small crew profitably next season.",
      why_now: "Neighbor offered to refer me if I look legit.",
      assets: ["Skills", "Tools", "Network"],
      stated_blocker: "Need a partner who knows the business.",
      tried: "Did two small jobs for cash; pricing was wrong.",
      constraints: "Can only work weekends until spring.",
      one_thing: "I need a partner or I need training — not sure which.",
      lane: "Builder",
      response_speed: "No rush",
      notes: "Matching shadow mule — training vs partner symptom."
    }
  }
];

const GOLDEN_TOP_PATHS = {
  capital_partner: "verify_proof",
  job_change: "find_better_job",
  training_not_partner: "get_training"
};

async function detectSiteOrigin() {
  const local = "http://localhost:3000";
  try {
    const res = await fetch(`${local}/operator/matching/shadow`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return local;
  } catch {
    /* fall through */
  }
  return "https://werkles.com";
}

async function resolveSiteOrigin() {
  const fromEnv = (process.env.WERKLES_SITE_ORIGIN || "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return detectSiteOrigin();
}

async function postIntake(scenario, siteOrigin) {
  const url = `${siteOrigin}/api/discovery/intake`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scenario.body)
  });
  const body = await res.json().catch(() => ({}));
  return {
    scenario: scenario.name,
    label: scenario.label,
    pass: res.ok && body.success && Boolean(body.shadow_run_id),
    status: res.status,
    intake_id: body.intake_id ?? null,
    shadow_run_id: body.shadow_run_id ?? null,
    shadow_top_eligible_path: body.shadow_top_eligible_path ?? null,
    shadow_disqualified_kinds: body.shadow_disqualified_kinds ?? [],
    matching_mode: body.matching_mode ?? null,
    error: body.error ?? null
  };
}

async function probeShadowPage(siteOrigin) {
  const res = await fetch(`${siteOrigin}/operator/matching/shadow`);
  const html = await res.text();
  const pass = res.ok && /Shadow runs|Autonomous matching/i.test(html);
  return { name: "operator_shadow_page", pass, status: res.status, detail: pass ? "Page loads" : "Page missing expected copy" };
}

function semanticChecks(intakeChecks) {
  return intakeChecks.map((check) => {
    const expectedTopPath = GOLDEN_TOP_PATHS[check.scenario];
    const topEligible = check.shadow_top_eligible_path ?? null;
    const disqualifiedKinds = check.shadow_disqualified_kinds ?? [];
    const partnerSuppressed =
      check.scenario !== "training_not_partner" || disqualifiedKinds.includes("find_partner");
    const deduplicated = new Set(disqualifiedKinds).size === disqualifiedKinds.length;
    return {
      name: `semantic_${check.scenario}`,
      scenario: check.scenario,
      pass: topEligible === expectedTopPath && partnerSuppressed && deduplicated,
      shadow_run_id: check.shadow_run_id,
      expected_top_path: expectedTopPath,
      actual_top_path: topEligible,
      disqualified_kinds: disqualifiedKinds,
      partner_suppressed: partnerSuppressed,
      disqualifications_deduplicated: deduplicated
    };
  });
}

async function main() {
  const siteOrigin = await resolveSiteOrigin();
  const checks = [];
  for (const scenario of SCENARIOS) {
    checks.push(await postIntake(scenario, siteOrigin));
  }
  const intakeChecks = [...checks];
  checks.push(...semanticChecks(intakeChecks));
  checks.push(await probeShadowPage(siteOrigin));

  const ok = checks.every((c) => c.pass);
  const out = {
    ok,
    schema: "WERKLES_MATCHING_SHADOW_SMOKE_V1",
    timestamp: new Date().toISOString(),
    site_origin: siteOrigin,
    checks,
    operator_review_url: `${siteOrigin}/operator/matching/shadow`,
    notes: [
      "Review shadow runs at /operator/matching/shadow after deploy.",
      "File receipt: foreman/receipts/WERKLES_MATCHING_SHADOW_QA_<date>.md",
      "Report false positives to Maker for layer0/not-match/score-paths tuning."
    ]
  };
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  process.stdout.write(JSON.stringify({ ok: false, error: err.message }) + "\n");
  process.exit(1);
});
