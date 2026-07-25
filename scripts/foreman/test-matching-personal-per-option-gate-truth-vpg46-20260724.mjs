#!/usr/bin/env node

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const fixturePath =
  "scripts/foreman/fixtures/vpg46-matching-generation-gate-contract-20260724.json";
const fixture = JSON.parse(read(fixturePath));

function loadTs(source, localRequire = (specifier) => require(specifier)) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", output)(localRequire, loaded.exports, loaded);
  return loaded.exports;
}

const recommendationTypes = loadTs(read("lib/squibb/recommendations.ts"));
const gateBuilder = loadTs(read("lib/matching/public-recommendation-gates.ts"));
const disclosure = loadTs(read("lib/matching/personal-recommendation-disclosure.ts"));
const shadowMapper = loadTs(
  read("lib/matching/shadow-to-recommendations.ts"),
  (specifier) => {
    if (specifier === "@/lib/matching/public-recommendation-gates") return gateBuilder;
    if (specifier === "@/lib/squibb/recommendations") return recommendationTypes;
    return require(specifier);
  }
);
const contract = loadTs(
  read("lib/matching/personal-recommendation-contract.ts"),
  (specifier) => {
    if (specifier === "@/lib/squibb/recommendations") return recommendationTypes;
    if (specifier === "@/lib/matching/personal-recommendation-disclosure") {
      return disclosure;
    }
    if (specifier === "@/lib/matching/public-recommendation-gates") return gateBuilder;
    return require(specifier);
  }
);
const kinds = Object.keys(fixture.required_domain_gate_kind);

const mappedSession = shadowMapper.shadowRunToRecommendationSession({
  source: "member_profile",
  createdAt: "1970-01-01T00:00:00.000Z",
  intakeId: "private-profile",
  signals: { statedNeed: "Find a practical next step" },
  readout: {
    primaryBottleneck: "Review this possible next step and its limits before acting.",
    recommendationCard: {
      whatYouAskedFor: "Find a practical next step",
      whatWeHeardUnderneath: "A reversible next step may help.",
      visibleReasons: ["Your saved profile supplied the current inputs."]
    },
    scoredPaths: kinds.map((kind, index) => ({
      kind,
      rank: index + 1,
      score: Math.max(1, 90 - index),
      confidenceLabel: "medium",
      rationale: ["Confirm the evidence and limits before acting."],
      evidenceStrength: "self_reported"
    })),
    facts: [
      {
        id: "stated-need",
        value: "Find a practical next step",
        strength: "self_reported"
      }
    ]
  }
});
const ranked = mappedSession.ranked;
const personalSession = {
  ...mappedSession,
  statedNeed: "Find a practical next step",
  operatorContext: disclosure.PERSONAL_RECOMMENDATION_OPERATOR_CONTEXT,
  squibbIntro: disclosure.PERSONAL_RECOMMENDATION_INTRO,
  source: {
    mode: "authenticated_profile",
    label: disclosure.PERSONAL_RECOMMENDATION_SOURCE_LABEL,
    detail: disclosure.PERSONAL_RECOMMENDATION_SOURCE_DETAIL
  },
  generation: { ...disclosure.PERSONAL_RECOMMENDATION_GENERATION },
  ranked,
  catalog: structuredClone(ranked)
};
const validResponse = {
  success: true,
  persisted: false,
  status: "personal",
  session: personalSession
};

const failures = [];
const checks = [];
function check(name, condition, detail = null) {
  checks.push({ name, pass: Boolean(condition), detail });
  if (!condition) failures.push({ name, detail });
}

function responseAccepted(response) {
  return contract.isPersonalRecommendationResponse(response);
}

function mutationCase(name, mutate) {
  const response = structuredClone(validResponse);
  mutate(response);
  const accepted = responseAccepted(response);
  check(`mutation_rejected_${name}`, !accepted);
  return { name, expected: "reject", accepted };
}

check("valid_every-kind_session_classifies_personal", responseAccepted(validResponse));

for (const recommendation of ranked) {
  const universal = recommendation.humanGates.find(
    (gate) => gate.id === fixture.universal_gate.id
  );
  const expectedDomain = fixture.required_domain_gate_kind[recommendation.kind];
  const domain = recommendation.humanGates.find((gate) => gate.id === expectedDomain.id);
  check(
    `generator_universal_gate_${recommendation.kind}`,
    Boolean(
      universal &&
        universal.kind === fixture.universal_gate.kind &&
        universal.severity === fixture.universal_gate.severity &&
        universal.benMustApprove === fixture.universal_gate.benMustApprove
    ),
    universal ?? null
  );
  check(
    `generator_domain_gate_${recommendation.kind}`,
    Boolean(
      domain &&
        domain.kind === expectedDomain.kind &&
        domain.benMustApprove === true
    ),
    domain ?? null
  );
}

const mutationResults = [];
for (const deck of ["ranked", "catalog"]) {
  for (let index = 0; index < kinds.length; index += 1) {
    const kind = kinds[index];
    const domainId = fixture.required_domain_gate_kind[kind].id;
    mutationResults.push(
      mutationCase(`${deck}_${kind}_empty_gates`, (response) => {
        response.session[deck][index].humanGates = [];
      })
    );
    mutationResults.push(
      mutationCase(`${deck}_${kind}_missing_universal_gate`, (response) => {
        response.session[deck][index].humanGates = response.session[deck][
          index
        ].humanGates.filter((gate) => gate.id !== fixture.universal_gate.id);
      })
    );
    mutationResults.push(
      mutationCase(`${deck}_${kind}_universal_gate_not_approval`, (response) => {
        const gate = response.session[deck][index].humanGates.find(
          (entry) => entry.id === fixture.universal_gate.id
        );
        gate.benMustApprove = false;
      })
    );
    mutationResults.push(
      mutationCase(`${deck}_${kind}_missing_domain_gate`, (response) => {
        response.session[deck][index].humanGates = response.session[deck][
          index
        ].humanGates.filter((gate) => gate.id !== domainId);
      })
    );
  }
}

mutationResults.push(
  mutationCase("duplicate_rank", (response) => {
    response.session.ranked[1].rank = response.session.ranked[0].rank;
  }),
  mutationCase("rank_gap", (response) => {
    response.session.ranked[1].rank = 99;
  }),
  mutationCase("catalog_rank_order_drift", (response) => {
    response.session.catalog[0].rank = 2;
    response.session.catalog[1].rank = 1;
  })
);

for (const field of fixture.forbidden_positive_claim_fields) {
  mutationResults.push(
    mutationCase(`response_claim_${field}`, (response) => {
      response[field] = true;
    }),
    mutationCase(`source_claim_${field}`, (response) => {
      response.session.source[field] = true;
    }),
    mutationCase(`recommendation_claim_${field}`, (response) => {
      response.session.ranked[1][field] = true;
    })
  );
}

const surface = read("components/squibb/recommendation-surface.tsx");
check(
  "ui_renders_selected_option_gate_strip",
  /<HumanGateStrip gates=\{selected\.humanGates\}/.test(surface)
);
check(
  "personal_ui_has_no_automatic_action_control",
  !/isPersonal[\s\S]{0,1400}(?:send intro|contact person|make payment|take action)/i.test(
    surface
  )
);

const result = {
  schema: "werkles.vpg46-ender-matching-per-option-gate-truth/v1",
  cycle_id: fixture.cycle_id,
  legacy_label: fixture.legacy_label,
  fixture: fixturePath,
  idea: "PER_OPTION_GATE_AND_AUTHORITY_TRUTH",
  recommendation_kind_count: kinds.length,
  check_count: checks.length,
  mutation_count: mutationResults.length,
  failure_count: failures.length,
  mutation_bypasses: mutationResults.filter((entry) => entry.accepted).map((entry) => entry.name),
  failures,
  result: failures.length === 0 ? "PASS" : "FAIL"
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 2;
