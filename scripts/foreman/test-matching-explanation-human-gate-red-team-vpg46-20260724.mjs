#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const catalogPath =
  "scripts/foreman/fixtures/vpg46-matching-explanation-gate-attacks-20260724.json";
const catalog = JSON.parse(read(catalogPath));

function loadTs(source, localRequire = (specifier) => require(specifier)) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", output)(
    localRequire,
    loaded.exports,
    loaded
  );
  return loaded.exports;
}

const recommendationTypes = loadTs(read("lib/squibb/recommendations.ts"));
const recommendationGates = loadTs(
  read("lib/matching/public-recommendation-gates.ts")
);
const personalDisclosure = loadTs(
  read("lib/matching/personal-recommendation-disclosure.ts")
);
const contract = loadTs(
  read("lib/matching/personal-recommendation-contract.ts"),
  (specifier) => {
    if (specifier === "@/lib/squibb/recommendations") {
      return recommendationTypes;
    }
    if (specifier === "@/lib/matching/personal-recommendation-disclosure") {
      return personalDisclosure;
    }
    if (specifier === "@/lib/matching/public-recommendation-gates") {
      return recommendationGates;
    }
    return require(specifier);
  }
);

const CANONICAL_GENERATION =
  personalDisclosure.PERSONAL_RECOMMENDATION_GENERATION;
const MATCHING_CONFIDENCE_EXPLANATION =
  "Rules-based path score from what you entered and the proof gaps recorded here. It is not a probability of success or eligibility.";

function canonicalPersonalSession() {
  const example = recommendationTypes.loadSquibbRecommendationSession();
  const session = structuredClone(example);
  session.operatorContext =
    personalDisclosure.PERSONAL_RECOMMENDATION_OPERATOR_CONTEXT;
  session.squibbIntro = personalDisclosure.PERSONAL_RECOMMENDATION_INTRO;
  session.source = {
    mode: "authenticated_profile",
    label: personalDisclosure.PERSONAL_RECOMMENDATION_SOURCE_LABEL,
    detail: personalDisclosure.PERSONAL_RECOMMENDATION_SOURCE_DETAIL
  };
  session.generation = structuredClone(CANONICAL_GENERATION);

  for (const recommendation of session.ranked) {
    recommendation.humanGates =
      recommendationGates.publicMatchingHumanGates(recommendation.kind);
    recommendation.title =
      recommendationTypes.RECOMMENDATION_KIND_LABELS[recommendation.kind];
    recommendation.squibbNote =
      recommendation.rank === 1
        ? "This is the highest-ranked path not ruled out by the current rules."
        : "This is another path not ruled out by the current rules to compare before deciding what to do.";
    recommendation.confidence.why = MATCHING_CONFIDENCE_EXPLANATION;
    recommendation.suggestedAgent = "Werkles human review";
    delete recommendation.suggestedTool;
    recommendation.keepOriginalPathLabel = "Keep my current approach";
  }
  session.catalog = structuredClone(session.ranked);
  return session;
}

function responseFrom(session) {
  return {
    success: true,
    persisted: false,
    status: "personal",
    session
  };
}

const baseline = responseFrom(canonicalPersonalSession());
assert.equal(
  contract.isPersonalRecommendationResponse(baseline),
  true,
  "canonical personal response must be accepted"
);
assert.equal(
  contract.classifyPersonalRecommendationResponse({
    status: 200,
    ok: true,
    payload: baseline
  }).status,
  "personal",
  "canonical personal response must classify personal"
);
assert.ok(baseline.session.ranked.length >= 2, "gate-order adversary needs two ranked items");
assert.ok(baseline.session.catalog.length >= 1, "gate adversary needs a catalog item");

const attacks = [];
function attack(idea, id, mutate) {
  attacks.push({ idea, id, mutate });
}

const IDEA_EXPLANATION = "GENERATION_SOURCE_TRUTH_AUTHORITY_LAUNDERING";
const IDEA_GATES = "PER_OPTION_DECK_ORDER_HUMAN_GATE_LAUNDERING";

function matchingCatalogItem(session, rankedIndex) {
  const ranked = session.ranked[rankedIndex];
  const catalog = session.catalog.find((entry) => entry.id === ranked.id);
  assert.ok(catalog, `missing catalog twin for ${ranked.id}`);
  return catalog;
}

function mutateRecommendationPair(session, rankedIndex, mutate) {
  mutate(session.ranked[rankedIndex]);
  mutate(matchingCatalogItem(session, rankedIndex));
}

attack(IDEA_EXPLANATION, "operator_context_ai_generated", (session) => {
  session.operatorContext =
    "An AI model generated this result and independently selected the best person.";
});
attack(IDEA_EXPLANATION, "intro_automatic_provider", (session) => {
  session.squibbIntro =
    "Werkles automatically asked an outside provider to choose and deliver this result.";
});
attack(IDEA_EXPLANATION, "source_label_ai_service", (session) => {
  session.source.label = "Autonomous AI matching service";
});
attack(IDEA_EXPLANATION, "source_detail_contact_and_payment", (session) => {
  session.source.detail =
    "A provider contacted the recipient and initiated payment automatically.";
});
attack(IDEA_EXPLANATION, "headline_automatic_contact", (session) => {
  mutateRecommendationPair(session, 0, (recommendation) => {
    recommendation.headline =
      "Werkles already contacted the person and confirmed the introduction.";
  });
});
attack(IDEA_EXPLANATION, "squibb_note_payment_complete", (session) => {
  mutateRecommendationPair(session, 0, (recommendation) => {
    recommendation.squibbNote =
      "Payment is complete and no human decision remains.";
  });
});
attack(IDEA_EXPLANATION, "reasoning_provider_confirmation", (session) => {
  mutateRecommendationPair(session, 0, (recommendation) => {
    recommendation.reasoning.rationale = [
      "An external provider verified and approved this action."
    ];
  });
});
attack(IDEA_EXPLANATION, "confidence_ai_probability", (session) => {
  mutateRecommendationPair(session, 0, (recommendation) => {
    recommendation.confidence.why =
      "The AI model predicts a 99 percent probability of success.";
  });
});
attack(IDEA_EXPLANATION, "evidence_source_contacted_recipient", (session) => {
  assert.ok(session.ranked[0].evidence.length > 0);
  mutateRecommendationPair(session, 0, (recommendation) => {
    recommendation.evidence[0].source =
      "Werkles contacted the external recipient automatically.";
  });
});
attack(IDEA_EXPLANATION, "suggested_dispatch_already_done", (session) => {
  mutateRecommendationPair(session, 0, (recommendation) => {
    recommendation.suggestedAgent =
      "Automatic provider dispatch already completed";
    recommendation.suggestedTool = "Payment initiated";
  });
});
attack(IDEA_EXPLANATION, "generation_contract_missing", (session) => {
  delete session.generation;
});
attack(IDEA_EXPLANATION, "generation_ai_provider_recipient_true", (session) => {
  session.generation.aiModelUsed = true;
  session.generation.providerContacted = true;
  session.generation.externalRecipientContacted = true;
});
attack(IDEA_EXPLANATION, "generation_result_persisted", (session) => {
  session.generation.recommendationPersisted = true;
});
attack(
  IDEA_EXPLANATION,
  "generation_intro_contact_payment_action_true",
  (session) => {
    session.generation.introSent = true;
    session.generation.contactMade = true;
    session.generation.paymentInitiated = true;
    session.generation.actionTaken = true;
  }
);
attack(IDEA_EXPLANATION, "generation_method_input_execution_drift", (session) => {
  session.generation.method = "provider_ai";
  session.generation.input = "external_people_search";
  session.generation.execution = "background_delivery";
});
attack(IDEA_EXPLANATION, "generation_explanation_blank", (session) => {
  session.generation.explanation = " ";
});

function approvalFreeGate(id) {
  return {
    id,
    label: "No review required",
    kind: "none",
    severity: "info",
    reason: "Act immediately.",
    benMustApprove: false
  };
}

attack(
  IDEA_GATES,
  "first_rendered_item_approval_free_later_rank_one_safe",
  (session) => {
    session.ranked[0].rank = 2;
    session.ranked[1].rank = 1;
    session.ranked[0].humanGates = [approvalFreeGate("unsafe-first")];
  }
);
attack(IDEA_GATES, "lower_ranked_item_approval_free", (session) => {
  mutateRecommendationPair(session, 1, (recommendation) => {
    recommendation.humanGates = [approvalFreeGate("unsafe-lower-rank")];
  });
});
attack(IDEA_GATES, "catalog_item_approval_free", (session) => {
  session.catalog[0].humanGates = [approvalFreeGate("unsafe-catalog")];
});
attack(IDEA_GATES, "same_id_cross_deck_gate_drift", (session) => {
  const shared = session.catalog[0];
  shared.id = session.ranked[0].id;
  shared.humanGates[1].reason =
    "This altered domain gate falsely claims authority was already granted.";
});
attack(IDEA_GATES, "pseudo_approval_none_info", (session) => {
  mutateRecommendationPair(session, 0, (recommendation) => {
    recommendation.humanGates = [
      {
        id: "pseudo-approval",
        label: "No review required",
        kind: "none",
        severity: "info",
        reason: "The automatic action is already approved.",
        benMustApprove: true
      }
    ];
  });
});
attack(IDEA_GATES, "universal_review_gate_removed", (session) => {
  const domainGates = session.ranked[0].humanGates.filter(
    (gate) => gate.id !== "matching-human-review"
  );
  assert.ok(domainGates.some((gate) => gate.benMustApprove));
  mutateRecommendationPair(session, 0, (recommendation) => {
    recommendation.humanGates = structuredClone(domainGates);
  });
});
attack(IDEA_GATES, "gate_reason_claims_action_already_happened", (session) => {
  mutateRecommendationPair(session, 0, (recommendation) => {
    const universal = recommendation.humanGates.find(
      (gate) => gate.id === "matching-human-review"
    );
    assert.ok(universal);
    universal.reason =
      "The introduction, contact, and payment already happened automatically.";
  });
});

const catalogCaseIds = catalog.ideas.flatMap((idea) => idea.cases);
assert.equal(catalog.ideas.length, 2, "VPG46 must execute exactly two ideas");
assert.deepEqual(
  attacks.map((entry) => entry.id).sort(),
  [...catalogCaseIds].sort(),
  "attack implementation drifted from catalog"
);
assert.deepEqual(
  new Set(attacks.map((entry) => entry.idea)),
  new Set(catalog.ideas.map((idea) => idea.id)),
  "attack ideas drifted from catalog"
);

const results = attacks.map(({ idea, id, mutate }) => {
  const session = canonicalPersonalSession();
  mutate(session);
  const response = responseFrom(session);
  const accepted = contract.isPersonalRecommendationResponse(response);
  const classification = contract.classifyPersonalRecommendationResponse({
    status: 200,
    ok: true,
    payload: response
  });
  return {
    idea,
    id,
    expected: "reject",
    accepted,
    classified_status: classification.status,
    bypass: accepted || classification.status === "personal"
  };
});

const bypasses = results.filter((entry) => entry.bypass);
const summary = {
  schema: "werkles.vpg46-thufir-matching-explanation-gate-red-team/v1",
  cycle_id: catalog.cycle_id,
  legacy_label: catalog.legacy_label,
  seat: "Thufir@Betsy",
  exact_ideas_executed: 2,
  canonical_control: "PASS",
  case_count: results.length,
  rejected_count: results.length - bypasses.length,
  bypass_count: bypasses.length,
  bypass_ids: bypasses.map((entry) => entry.id),
  results,
  result: bypasses.length === 0 ? "PASS" : "FAIL"
};

console.log(JSON.stringify(summary, null, 2));
if (bypasses.length > 0) process.exitCode = 2;
