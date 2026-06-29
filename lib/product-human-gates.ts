import { stripeManifest } from "@/lib/stripe-manifest";

export type ProductHumanGateStatus = "ready_for_review" | "operator_gate" | "blocked";

export type ProductHumanGate = {
  key: string;
  title: string;
  status: ProductHumanGateStatus;
  area: "stripe" | "crucible" | "production";
  gatePhrase: string | null;
  visibleProof: string;
  blockedUntil: string;
  operatorAction: string;
};

export type ProductGateKnockoutStep = {
  order: number;
  key: string;
  title: string;
  gatePhrase: string | null;
  status: ProductHumanGateStatus;
  operatorUrl: string | null;
  localRoutes: string[];
  benAction: string;
  agentPrep: string[];
  forbiddenActions: string[];
  proofRequired: string[];
  stopCondition: string;
  notes: string;
};

export type ProductGateSessionBrief = {
  preflight: string[];
  evidenceBuckets: string[];
  decisionRecordFields: string[];
  wrapUpChecks: string[];
};

export type ProductGateDecisionPacket = {
  title: string;
  purpose: string;
  redactionRules: string[];
  allowedOutcomes: string[];
  packetFields: string[];
};

export type ProductGatePreflightCheck = {
  key: string;
  label: string;
  gateKeys: string[];
  proof: string;
  stopIfMissing: string;
};

export type ProductGateEnvName = {
  name: string;
  purpose: string;
  source: string;
  secretValue: boolean;
};

export type ProductGatePreflightMatrix = {
  routeChecks: ProductGatePreflightCheck[];
  envNames: ProductGateEnvName[];
  providerChecks: ProductGatePreflightCheck[];
  productionChecks: ProductGatePreflightCheck[];
};

export type ProductGateDependencyStatus = "review_now" | "blocked_by_prior_gate" | "policy_blocked" | "last_only";

export type ProductGateDependency = {
  gateKey: string;
  status: ProductGateDependencyStatus;
  dependsOn: string[];
  skipRisk: string;
  unlocks: string[];
  nextAllowedAction: string;
};

export type ProductGateOperatorSurface = {
  title: string;
  href: string;
  purpose: string;
  useWhen: string;
};

export type ProductGateScopeOption = {
  key: string;
  title: string;
  recommendation: "include_now" | "scope_out_for_v0" | "blocked_until_policy";
  gates: string[];
  keep: string;
  cut: string;
  proofNeeded: string;
};

export type ProductGateDryRunStep = {
  order: number;
  title: string;
  route: string;
  proof: string;
  mustNotDo: string;
};

export type ProductGateReadinessScore = {
  key: string;
  title: string;
  state: "ready_to_review" | "needs_prior_gate" | "policy_blocked" | "last_only";
  evidence: string;
  blocker: string;
  nextAction: string;
};

export type ProductGateFaq = {
  question: string;
  answer: string;
};

export type ProductGateEvidenceItem = {
  gateKey: string;
  label: string;
  acceptableProof: string;
  unacceptableProof: string;
  redactionRule: string;
};

export const productGateSessionBrief: ProductGateSessionBrief = {
  preflight: [
    "Open /operator/gate-knockout, /membership, /dashboard/billing, and /dashboard/crucible locally.",
    "Open Stripe test dashboard before reviewing Gate 1.",
    "Open Stripe live dashboard only when Ben is ready to review live product or webhook gates.",
    "Open hosting environment settings only when Ben is ready for private secret entry.",
    "Keep counsel/provider notes available before touching background-check scope."
  ],
  evidenceBuckets: [
    "Local route proof: page URL, status shown, and relevant readiness panel text.",
    "Stripe proof: dashboard mode, product/price/webhook identifiers, and event names without exposing secrets.",
    "Secret-entry proof: environment variable names entered privately, never values.",
    "Provider proof: provider mode, receipt expectations, and whether any session remains unopened.",
    "Policy proof: counsel/provider decision notes for FCRA-sensitive background-check work.",
    "Production proof: route smoke results, rollback note, and explicit production approval phrase."
  ],
  decisionRecordFields: [
    "Gate number and title.",
    "Exact phrase used, or BLOCKED if no phrase is available.",
    "Who performed the Ben-only action.",
    "Proof artifact or screenshot location.",
    "Stop condition checked.",
    "Next gate allowed, blocked, or deferred."
  ],
  wrapUpChecks: [
    "Confirm no secrets were pasted into chat, files, logs, receipts, or commits.",
    "Confirm no live Stripe/provider/production action occurred without the matching phrase.",
    "Confirm background checks remain blocked unless counsel/provider approval exists.",
    "Confirm any deferred gate has a clear next proof requirement.",
    "Confirm production rollout remains last."
  ]
};

export const productGateDecisionPacket: ProductGateDecisionPacket = {
  title: "Copy-safe Gate Decision Packet",
  purpose:
    "Record exactly what happened in a gate session without putting secrets, payment credentials, provider PII, or production-only values into chat, commits, receipts, or logs.",
  redactionRules: [
    "Use secret names only, never secret values.",
    "Use Stripe mode and object type, not full private dashboard payloads.",
    "Use provider session status, not applicant PII or provider result payloads.",
    "Use screenshot/file path references for proof; do not paste credentials or sensitive records.",
    "Use BLOCKED when a required proof or policy approval is missing."
  ],
  allowedOutcomes: [
    "APPROVED: exact gate phrase was given and proof exists.",
    "BLOCKED: a stop condition, policy blocker, missing proof, login, secret, or provider gate stopped the session.",
    "DEFERRED: Ben intentionally postponed the gate without authorizing the next gate.",
    "SCOPED_OUT: Ben explicitly removed the gate from the current rollout scope."
  ],
  packetFields: [
    "Gate",
    "Outcome",
    "Exact phrase or BLOCKED/DEFERRED/SCOPED_OUT",
    "Ben-only action performed by",
    "Agent prep performed",
    "Proof reference",
    "Redactions applied",
    "Stop condition checked",
    "Next gate status",
    "Notes"
  ]
};

export function productGateDecisionTemplate() {
  const lines = [
    productGateDecisionPacket.title,
    "",
    "Session timestamp:",
    "Operator:",
    "Local app URL: http://127.0.0.1:3005/operator/gate-knockout",
    "",
    "Global redaction confirmation:",
    "- No secrets pasted into chat/files/logs/receipts/commits.",
    "- No provider PII or background-check artifacts pasted into chat/files/logs/receipts/commits.",
    "- No live action occurred without the matching exact phrase.",
    ""
  ];

  for (const step of productGateKnockoutSteps) {
    lines.push(
      `Gate ${step.order}: ${step.title}`,
      `Required phrase: ${step.gatePhrase ?? "BLOCKED - no approval phrase until policy/provider proof exists"}`,
      "Outcome:",
      "Ben-only action performed by:",
      "Agent prep performed:",
      "Proof reference:",
      "Redactions applied:",
      `Stop condition checked: ${step.stopCondition}`,
      "Next gate status:",
      "Notes:",
      ""
    );
  }

  lines.push("Session wrap-up:", "- Production rollout remains last.", "- Deferred or blocked gates have clear next proof.");

  return lines.join("\n");
}

const stripeManifestEnvNames: ProductGateEnvName[] = stripeManifest.products.map((product) => ({
  name: product.envVar,
  purpose: `${product.name} ${product.mode} price ID (${product.displayPrice})`,
  source: "lib/stripe-manifest.ts",
  secretValue: false
}));

export const productGatePreflightMatrix: ProductGatePreflightMatrix = {
  routeChecks: [
    {
      key: "pricing",
      label: "Pricing surface",
      gateKeys: ["stripe-live-products", "background-fcra"],
      proof: "Open /pricing and confirm pricing, Crucible costs, and Human Gate readiness are visible.",
      stopIfMissing: "Stop product/pricing gate review if the pricing page fails to render."
    },
    {
      key: "membership",
      label: "Membership checkout surface",
      gateKeys: ["stripe-test-checkout-webhook", "stripe-live-checkout"],
      proof: "Open /membership and confirm Foundry Dues plans plus Stripe payments gate readiness are visible.",
      stopIfMissing: "Stop checkout review if membership plans or gate readiness are missing."
    },
    {
      key: "billing",
      label: "Billing dashboard surface",
      gateKeys: ["stripe-test-checkout-webhook", "stripe-live-secret-entry", "stripe-live-checkout"],
      proof: "Open /dashboard/billing and confirm billing state is preview/gated unless live Stripe proof exists.",
      stopIfMissing: "Stop live checkout review if billing state cannot be inspected."
    },
    {
      key: "crucible",
      label: "Crucible provider surface",
      gateKeys: ["crucible-provider-test", "background-fcra"],
      proof: "Open /dashboard/crucible and confirm provider/background-check readiness is visible and gated.",
      stopIfMissing: "Stop provider review if Crucible readiness or blocked background-check copy is missing."
    },
    {
      key: "dashboard",
      label: "Member dashboard operator visibility",
      gateKeys: ["production-rollout"],
      proof: "Open /dashboard and confirm Gate Knockout and decision packet links are visible.",
      stopIfMissing: "Stop rollout review if operators cannot find the gate runbook from the member surface."
    }
  ],
  envNames: [
    {
      name: "STRIPE_SECRET_KEY",
      purpose: "Private Stripe API key for server-side Stripe calls.",
      source: "lib/stripe.ts",
      secretValue: true
    },
    {
      name: "STRIPE_WEBHOOK_SECRET",
      purpose: "Private signing secret for Stripe webhook verification.",
      source: "app/api/webhooks/stripe/route.ts",
      secretValue: true
    },
    ...stripeManifestEnvNames,
    {
      name: "STRIPE_MONTHLY_PRICE_ID",
      purpose: "Legacy fallback for monthly Foundry Dues price ID.",
      source: "lib/stripe.ts",
      secretValue: false
    },
    {
      name: "STRIPE_YEARLY_PRICE_ID",
      purpose: "Legacy fallback for annual Foundry Dues price ID.",
      source: "lib/stripe.ts",
      secretValue: false
    }
  ],
  providerChecks: [
    {
      key: "stripe-mode",
      label: "Stripe dashboard mode",
      gateKeys: ["stripe-test-checkout-webhook", "stripe-live-products", "stripe-live-checkout"],
      proof: "Record whether Stripe is in test or live mode without pasting private dashboard payloads.",
      stopIfMissing: "Stop if test/live mode is ambiguous."
    },
    {
      key: "identity-provider",
      label: "Identity/funds provider account",
      gateKeys: ["crucible-provider-test"],
      proof: "Record provider mode and receipt expectation; do not open a paid/live session automatically.",
      stopIfMissing: "Stop if provider account, billing, OAuth, or final activation is required."
    },
    {
      key: "background-policy",
      label: "Background-check policy proof",
      gateKeys: ["background-fcra"],
      proof: "Record counsel/provider approval references before collecting consent or starting any check.",
      stopIfMissing: "Stop if FCRA consent, adverse-action, retention, provider, or permitted-use proof is missing."
    }
  ],
  productionChecks: [
    {
      key: "route-smoke",
      label: "Route smoke proof",
      gateKeys: ["production-rollout"],
      proof: "Record local proof for /, /pricing, /membership, /dashboard/billing, and /dashboard/crucible.",
      stopIfMissing: "Stop production rollout if route proof is incomplete."
    },
    {
      key: "rollback-note",
      label: "Rollback note",
      gateKeys: ["production-rollout"],
      proof: "Record the rollback/verification note before deploy approval.",
      stopIfMissing: "Stop production rollout if rollback instructions are missing."
    },
    {
      key: "approval-phrase",
      label: "Production approval phrase",
      gateKeys: ["production-rollout"],
      proof: "Record APPROVE PRODUCTION ROLLOUT only after payment/provider gates are complete or scoped out.",
      stopIfMissing: "Stop any deploy, push, merge, SQL, production mutation, or public launch."
    }
  ]
};

export const productGateDependencies: ProductGateDependency[] = [
  {
    gateKey: "stripe-test-checkout-webhook",
    status: "review_now",
    dependsOn: [],
    skipRisk: "Live Stripe work would be ungrounded if test checkout and webhook behavior are not proven first.",
    unlocks: ["stripe-live-products"],
    nextAllowedAction: "Review test-mode checkout/webhook proof. Approval here authorizes test proof only."
  },
  {
    gateKey: "stripe-live-products",
    status: "blocked_by_prior_gate",
    dependsOn: ["stripe-test-checkout-webhook"],
    skipRisk: "Creating live products before test proof can bake the wrong prices or product shape into live Stripe.",
    unlocks: ["stripe-live-secret-entry"],
    nextAllowedAction: "Prepare names and price mapping; stop before final live product creation."
  },
  {
    gateKey: "stripe-live-secret-entry",
    status: "blocked_by_prior_gate",
    dependsOn: ["stripe-live-products"],
    skipRisk: "Entering live env values before live product IDs exist creates ambiguous checkout behavior.",
    unlocks: ["stripe-live-checkout"],
    nextAllowedAction: "Point to env var names only. Ben enters private values outside chat and repo."
  },
  {
    gateKey: "stripe-live-checkout",
    status: "blocked_by_prior_gate",
    dependsOn: ["stripe-test-checkout-webhook", "stripe-live-products", "stripe-live-secret-entry"],
    skipRisk: "A live checkout switch without webhook, price ID, and secret proof can charge money without reliable membership state.",
    unlocks: ["production-rollout"],
    nextAllowedAction: "Prepare live checkout smoke notes; do not run live payment without the exact go-live phrase."
  },
  {
    gateKey: "crucible-provider-test",
    status: "blocked_by_prior_gate",
    dependsOn: ["stripe-test-checkout-webhook"],
    skipRisk: "Provider testing before receipt expectations are clear can imply trust or clearance Werkles cannot support.",
    unlocks: ["production-rollout"],
    nextAllowedAction: "Prepare provider-mode and receipt expectations; stop at account, OAuth, billing, or activation."
  },
  {
    gateKey: "background-fcra",
    status: "policy_blocked",
    dependsOn: ["crucible-provider-test"],
    skipRisk: "Background checks without counsel/provider approval create FCRA, consent, adverse-action, and data-retention risk.",
    unlocks: [],
    nextAllowedAction: "Keep blocked. Gather counsel/provider policy proof before any consent collection or check."
  },
  {
    gateKey: "production-rollout",
    status: "last_only",
    dependsOn: [
      "stripe-test-checkout-webhook",
      "stripe-live-products",
      "stripe-live-secret-entry",
      "stripe-live-checkout",
      "crucible-provider-test"
    ],
    skipRisk: "Production rollout before payment/provider gates are complete or scoped out can expose unfinished money, provider, or compliance behavior.",
    unlocks: [],
    nextAllowedAction: "Only review after upstream gates are approved or explicitly scoped out."
  }
];

export function productGateByKey(key: string) {
  return productGateKnockoutSteps.find((gate) => gate.key === key);
}

export function productGateDependencyStatusLabel(status: ProductGateDependencyStatus) {
  if (status === "review_now") return "Review now";
  if (status === "blocked_by_prior_gate") return "Blocked by prior gate";
  if (status === "policy_blocked") return "Policy blocked";
  return "Last only";
}

export const productGateOperatorSurfaces: ProductGateOperatorSurface[] = [
  {
    title: "Gate Knockout",
    href: "/operator/gate-knockout",
    purpose: "Single-session runbook with exact phrases, proof requirements, stop conditions, and Ben/agent split.",
    useWhen: "Start here before any Stripe, provider, background-check, or production gate session."
  },
  {
    title: "Dependencies",
    href: "/operator/gate-knockout/dependencies",
    purpose: "Skip-prevention board showing what is reviewable now, blocked, policy blocked, or last-only.",
    useWhen: "Use when deciding whether a downstream gate is actually unlocked."
  },
  {
    title: "Preflight Matrix",
    href: "/operator/gate-knockout/preflight",
    purpose: "Route, env-name, provider, policy, and production proof matrix.",
    useWhen: "Use before a gate session to collect proof without exposing secrets."
  },
  {
    title: "Decision Packet",
    href: "/operator/gate-knockout/decision-packet",
    purpose: "Copy-safe record template for approvals, blockers, deferrals, and scoped-out gates.",
    useWhen: "Use during or immediately after Ben makes a gate decision."
  },
  {
    title: "Scope Planner",
    href: "/operator/gate-knockout/scope",
    purpose: "Clarifies what can ship in v0 and what should stay outside the first rollout.",
    useWhen: "Use before production planning or when a policy/provider blocker should not block unrelated work."
  },
  {
    title: "Dry Run",
    href: "/operator/gate-knockout/dry-run",
    purpose: "Mock/local-only route walkthrough for gathering product proof without crossing gates.",
    useWhen: "Use before asking Ben for any live approval phrase."
  },
  {
    title: "Readiness Scorecard",
    href: "/operator/gate-knockout/scorecard",
    purpose: "Condensed status board showing what can be reviewed, what is blocked, and what is last-only.",
    useWhen: "Use when Ben wants the shortest possible overview before deciding which gates to knock out."
  },
  {
    title: "Gate FAQ",
    href: "/operator/gate-knockout/faq",
    purpose: "Answers common operator questions and prevents approval phrase confusion.",
    useWhen: "Use when the session stalls or a phrase/proof boundary is unclear."
  },
  {
    title: "Evidence Index",
    href: "/operator/gate-knockout/evidence",
    purpose: "Maps each gate to acceptable proof, unacceptable proof, and redaction rules.",
    useWhen: "Use before filing a decision packet or receipt."
  }
];

export const productGateScopeOptions: ProductGateScopeOption[] = [
  {
    key: "foundry-dues-v0",
    title: "Foundry Dues payment v0",
    recommendation: "include_now",
    gates: ["stripe-test-checkout-webhook", "stripe-live-products", "stripe-live-secret-entry", "stripe-live-checkout"],
    keep: "Membership, billing, checkout, portal, and webhook-backed membership state.",
    cut: "Crucible provider checks, background checks, and any trust/clearance claims.",
    proofNeeded: "Test checkout/webhook proof plus live Stripe product/env/live checkout approvals."
  },
  {
    key: "crucible-preview-v0",
    title: "Crucible preview v0",
    recommendation: "scope_out_for_v0",
    gates: ["crucible-provider-test"],
    keep: "Preview copy, pricing visibility, and readiness language.",
    cut: "Provider session creation, paid checks, identity result claims, funds result claims.",
    proofNeeded: "Ben-approved provider test scope before any provider session is opened."
  },
  {
    key: "background-checks-v0",
    title: "Background checks",
    recommendation: "blocked_until_policy",
    gates: ["background-fcra"],
    keep: "Blocked readiness state and pricing disclosure only.",
    cut: "Consent collection, provider start, result storage, adverse-action workflow, continuous monitoring.",
    proofNeeded: "Counsel/provider review for FCRA consent, adverse action, retention, permitted use, and dispute flow."
  },
  {
    key: "production-shell-v0",
    title: "Production shell rollout",
    recommendation: "include_now",
    gates: ["production-rollout"],
    keep: "Routes that have local proof and whose live gates are complete or explicitly scoped out.",
    cut: "Any route implying active provider checks or background checks before policy proof.",
    proofNeeded: "Route smoke proof, rollback note, scoped-out list, and exact production approval phrase."
  }
];

export const productGateDryRunSteps: ProductGateDryRunStep[] = [
  {
    order: 1,
    title: "Confirm public pricing readiness",
    route: "/pricing",
    proof: "Pricing, Crucible costs, and Human Gate readiness links render.",
    mustNotDo: "Do not click into live Stripe product creation."
  },
  {
    order: 2,
    title: "Confirm membership checkout readiness",
    route: "/membership",
    proof: "Foundry Dues plans and Stripe gate readiness render in preview/mock mode.",
    mustNotDo: "Do not switch live Stripe keys or run a live payment."
  },
  {
    order: 3,
    title: "Confirm billing readiness",
    route: "/dashboard/billing",
    proof: "Billing state is visible and remains preview/gated unless live Stripe proof exists.",
    mustNotDo: "Do not open live customer portal with real customer data."
  },
  {
    order: 4,
    title: "Confirm Crucible readiness",
    route: "/dashboard/crucible",
    proof: "Provider and background-check readiness are visible, with background checks blocked.",
    mustNotDo: "Do not open provider sessions or collect background-check consent."
  },
  {
    order: 5,
    title: "Confirm operator gate visibility",
    route: "/dashboard",
    proof: "Member dashboard links to Gate Knockout, dependencies, preflight, and decision packet.",
    mustNotDo: "Do not treat local preview as production approval."
  },
  {
    order: 6,
    title: "Confirm operator packet stack",
    route: "/operator/gate-knockout",
    proof: "Runbook links to dependencies, preflight, decision packet, scope planner, and dry run.",
    mustNotDo: "Do not record APPROVED without Ben's exact phrase."
  }
];

export const productGateReadinessScores: ProductGateReadinessScore[] = [
  {
    key: "stripe-test-checkout-webhook",
    title: "Stripe test checkout + webhook",
    state: "ready_to_review",
    evidence: "Local membership/billing routes plus Stripe test webhook event proof.",
    blocker: "Missing webhook-backed membership-state proof.",
    nextAction: "Review this first; approval is test-mode only."
  },
  {
    key: "stripe-live-products",
    title: "Stripe live product creation",
    state: "needs_prior_gate",
    evidence: "Pricing manifest names, product names, and Stripe live dashboard readiness.",
    blocker: "Requires test checkout/webhook proof first.",
    nextAction: "Prepare mapping, then stop at live product creation approval."
  },
  {
    key: "stripe-live-secret-entry",
    title: "Live Stripe secret entry",
    state: "needs_prior_gate",
    evidence: "Environment variable names only; values entered privately by Ben.",
    blocker: "Requires live product/price IDs to exist.",
    nextAction: "Point to names only; never request or expose values."
  },
  {
    key: "stripe-live-checkout",
    title: "Live checkout go-live",
    state: "needs_prior_gate",
    evidence: "Live webhook, live env, live price IDs, and billing portal readiness.",
    blocker: "Requires test proof, live products, and private secret entry.",
    nextAction: "Prepare first-live-transaction smoke notes only."
  },
  {
    key: "crucible-provider-test",
    title: "Crucible provider test",
    state: "needs_prior_gate",
    evidence: "Provider mode and receipt expectations, with no paid/live session opened automatically.",
    blocker: "Provider account/OAuth/billing/final activation remains Ben-only.",
    nextAction: "Clarify receipt expectations and legal/trust copy."
  },
  {
    key: "background-fcra",
    title: "Background checks",
    state: "policy_blocked",
    evidence: "Counsel/provider approval for consent, adverse action, retention, permitted use, and disputes.",
    blocker: "No counsel/provider policy proof yet.",
    nextAction: "Keep visibly blocked."
  },
  {
    key: "production-rollout",
    title: "Production rollout",
    state: "last_only",
    evidence: "Route smoke proof, rollback note, scoped-out gates, and exact production phrase.",
    blocker: "All upstream payment/provider gates must be approved or explicitly scoped out.",
    nextAction: "Review only after upstream gate status is settled."
  }
];

export const productGateFaqs: ProductGateFaq[] = [
  {
    question: "Does test checkout approval authorize live checkout?",
    answer: "No. Test-mode approval only proves the test path. Live products, secrets, and live checkout each require their own gate."
  },
  {
    question: "Can an agent enter Stripe or hosting secrets if Ben says the variable names?",
    answer: "No. Agents may point to variable names only. Ben enters values privately outside chat, files, logs, receipts, and commits."
  },
  {
    question: "Can background checks ship if Crucible provider testing is approved?",
    answer: "No. Background checks remain policy blocked until counsel/provider approval exists for FCRA consent, adverse action, retention, permitted use, and disputes."
  },
  {
    question: "What if Ben wants to launch without Crucible checks?",
    answer: "Use the scope planner and decision packet to mark Crucible as scoped out for v0. Scoped out does not authorize running it later."
  },
  {
    question: "What proof is safe to paste into a receipt?",
    answer: "Paste route names, screenshot paths, dashboard mode, object types, and redacted identifiers. Do not paste secret values, provider PII, background-check artifacts, or private dashboard payloads."
  },
  {
    question: "When is production rollout allowed?",
    answer: "Only after payment/provider gates are complete or explicitly scoped out, local route proof exists, rollback notes exist, and Ben gives APPROVE PRODUCTION ROLLOUT."
  }
];

export const productGateEvidenceIndex: ProductGateEvidenceItem[] = [
  {
    gateKey: "stripe-test-checkout-webhook",
    label: "Test checkout/webhook proof",
    acceptableProof: "Test-mode checkout session proof plus webhook event receipt and profile membership-state update.",
    unacceptableProof: "Success page redirect alone.",
    redactionRule: "Redact customer/email/session details unless already non-sensitive test data."
  },
  {
    gateKey: "stripe-live-products",
    label: "Live product proof",
    acceptableProof: "Product names, price amounts, and price ID references recorded after Ben approval.",
    unacceptableProof: "Invented price IDs or unapproved live dashboard changes.",
    redactionRule: "Price IDs may be referenced; private dashboard payloads must not be pasted."
  },
  {
    gateKey: "stripe-live-secret-entry",
    label: "Secret-entry proof",
    acceptableProof: "Environment variable names marked entered privately by Ben.",
    unacceptableProof: "Secret values pasted into chat, files, logs, receipts, or commits.",
    redactionRule: "Use names only: never values."
  },
  {
    gateKey: "stripe-live-checkout",
    label: "Live checkout proof",
    acceptableProof: "Live webhook, live env, live price ID, billing portal readiness, and first-live-transaction plan.",
    unacceptableProof: "Test-mode success or live payment attempt without the exact phrase.",
    redactionRule: "Redact customer and payment identifiers."
  },
  {
    gateKey: "crucible-provider-test",
    label: "Provider test proof",
    acceptableProof: "Provider mode, receipt expectation, and confirmation no paid/live session was opened without approval.",
    unacceptableProof: "Provider result claims or clearance language without provider proof.",
    redactionRule: "No applicant PII or provider result payloads."
  },
  {
    gateKey: "background-fcra",
    label: "Background-check policy proof",
    acceptableProof: "Counsel/provider approval references for consent, adverse action, retention, permitted use, and disputes.",
    unacceptableProof: "Consent collection or provider check start before policy approval.",
    redactionRule: "No background-check artifacts or sensitive personal records."
  },
  {
    gateKey: "production-rollout",
    label: "Production rollout proof",
    acceptableProof: "Route smoke proof, rollback note, scoped-out list, and exact production approval phrase.",
    unacceptableProof: "Deploy, push, merge, SQL, production mutation, or public launch without explicit approval.",
    redactionRule: "No secrets, production data dumps, or private account payloads."
  }
];

export const productHumanGates: ProductHumanGate[] = [
  {
    key: "stripe-test-webhook",
    title: "Stripe test checkout + webhook",
    status: "ready_for_review",
    area: "stripe",
    gatePhrase: "APPROVE PAID CHECKOUT GO-LIVE (test mode)",
    visibleProof: "Preview proof is recorded as PASS; membership checkout and billing portal remain gated by auth, env, and webhook state.",
    blockedUntil: "Ben reviews the test-mode checkout and confirms webhook-backed membership state.",
    operatorAction: "Use test mode only. Confirm checkout session, webhook receipt, and profile subscription update before any live step."
  },
  {
    key: "stripe-live-products",
    title: "Stripe live products",
    status: "operator_gate",
    area: "stripe",
    gatePhrase: "APPROVE LIVE STRIPE PRODUCT CREATE",
    visibleProof: "Pricing and price-id environment names are defined in lib/stripe-manifest.ts.",
    blockedUntil: "Ben enters Stripe live dashboard and approves product creation.",
    operatorAction: "Do not create live products automatically. Prepare product names, prices, and env var mapping for Ben."
  },
  {
    key: "stripe-live-checkout",
    title: "Stripe live checkout",
    status: "operator_gate",
    area: "stripe",
    gatePhrase: "APPROVE PAID CHECKOUT GO-LIVE",
    visibleProof: "Checkout and portal routes exist; webhook remains source of truth.",
    blockedUntil: "Live price IDs and live webhook secret are entered privately and test-mode proof is accepted.",
    operatorAction: "Do not switch live keys or promote checkout until Ben gives the live go-live phrase."
  },
  {
    key: "crucible-identity-provider",
    title: "Crucible identity provider",
    status: "operator_gate",
    area: "crucible",
    gatePhrase: "APPROVE CRUCIBLE PROVIDER TEST",
    visibleProof: "Crucible route and pricing surface exist; identity/funds are preview states until provider wiring is approved.",
    blockedUntil: "Ben approves provider test setup and any required provider account/session work.",
    operatorAction: "Prepare provider-specific copy and receipt expectations. Do not open paid/live identity flow automatically."
  },
  {
    key: "background-checks",
    title: "Background checks",
    status: "blocked",
    area: "crucible",
    gatePhrase: null,
    visibleProof: "Pricing exposes background tiers, but copy marks them FCRA-sensitive.",
    blockedUntil: "Counsel-reviewed FCRA flow, adverse-action handling, provider selection, and Ben approval exist.",
    operatorAction: "Keep background checks visibly blocked. Do not collect consent or start a provider background check."
  },
  {
    key: "production-rollout",
    title: "Production rollout",
    status: "operator_gate",
    area: "production",
    gatePhrase: "APPROVE PRODUCTION ROLLOUT",
    visibleProof: "Production rollout, push, deploy, SQL, secrets, live verification, and Stripe live are hard stops.",
    blockedUntil: "Ben approves production rollout after payment/provider gates are satisfied.",
    operatorAction: "Continue localhost/product-readiness work only. Do not deploy, push, merge, or mutate production data."
  }
];

export const productGateKnockoutSteps: ProductGateKnockoutStep[] = [
  {
    order: 1,
    key: "stripe-test-checkout-webhook",
    title: "Stripe test checkout + webhook review",
    gatePhrase: "APPROVE PAID CHECKOUT GO-LIVE (test mode)",
    status: "ready_for_review",
    operatorUrl: "https://dashboard.stripe.com/test/webhooks",
    localRoutes: ["/membership", "/dashboard/billing"],
    benAction: "Review the test checkout path and confirm webhook-backed membership state.",
    agentPrep: [
      "Keep checkout in test or mock preview mode.",
      "Show where membership and billing state appear in the app.",
      "Collect route/browser proof without touching live keys."
    ],
    forbiddenActions: [
      "Do not switch to live Stripe keys.",
      "Do not treat success-page redirect as payment proof."
    ],
    proofRequired: [
      "Test checkout can be opened from /membership.",
      "Stripe webhook endpoint receives checkout/subscription events.",
      "Membership profile changes only after webhook receipt, not success-page redirect alone."
    ],
    stopCondition: "Stop if webhook proof is missing, auth is broken, or profile membership state is not webhook-backed.",
    notes: "This is still test mode. Approval here does not authorize live products, live keys, or production rollout."
  },
  {
    order: 2,
    key: "stripe-live-products",
    title: "Stripe live product and price creation",
    gatePhrase: "APPROVE LIVE STRIPE PRODUCT CREATE",
    status: "operator_gate",
    operatorUrl: "https://dashboard.stripe.com/products",
    localRoutes: ["/pricing", "/membership"],
    benAction: "Create or approve the live Stripe products and prices in the Stripe dashboard.",
    agentPrep: [
      "Prepare product names and price mapping.",
      "Keep env var names aligned with the Stripe manifest.",
      "Show pricing surfaces that will consume the price IDs."
    ],
    forbiddenActions: [
      "Do not click final create/update for live Stripe products.",
      "Do not invent or commit live price IDs."
    ],
    proofRequired: [
      "Foundry Dues monthly product matches lib/stripe-manifest.ts.",
      "Foundry Dues annual product matches lib/stripe-manifest.ts.",
      "Live price IDs are identified for private environment entry."
    ],
    stopCondition: "Stop before creating or modifying live products unless Ben is in the Stripe dashboard and approves.",
    notes: "Agents can prepare names/prices/env var mapping. Agents must not click final live product creation without approval."
  },
  {
    order: 3,
    key: "stripe-live-secret-entry",
    title: "Live Stripe secret and price ID entry",
    gatePhrase: "APPROVE SECRET ENTRY",
    status: "operator_gate",
    operatorUrl: "https://vercel.com/dashboard",
    localRoutes: ["/membership", "/dashboard/billing"],
    benAction: "Privately enter live Stripe keys, webhook secret, and price IDs in the hosting environment.",
    agentPrep: [
      "Point to the required environment variable names.",
      "Keep all examples redacted.",
      "Verify the app still renders without exposing secret values."
    ],
    forbiddenActions: [
      "Do not ask Ben to paste secrets into chat.",
      "Do not read, print, save, or commit secret values."
    ],
    proofRequired: [
      "STRIPE_SECRET_KEY is entered privately in the hosting environment.",
      "STRIPE_WEBHOOK_SECRET is entered privately in the hosting environment.",
      "Live Foundry Dues price IDs are entered privately.",
      "No secret is pasted into chat or committed to the repo."
    ],
    stopCondition: "Stop at any prompt requiring secrets, credentials, OAuth, billing, or final provider approval.",
    notes: "Ben handles secret entry. Agents may navigate and point, but never request or expose secret values."
  },
  {
    order: 4,
    key: "stripe-live-checkout",
    title: "Stripe live checkout go-live",
    gatePhrase: "APPROVE PAID CHECKOUT GO-LIVE",
    status: "operator_gate",
    operatorUrl: "https://dashboard.stripe.com/webhooks",
    localRoutes: ["/membership", "/dashboard/billing"],
    benAction: "Approve switching paid checkout to live mode after live env and webhook proof are complete.",
    agentPrep: [
      "Verify checkout and billing routes render correctly.",
      "Confirm webhook event names expected by the app.",
      "Prepare a smoke-test checklist for the first live transaction."
    ],
    forbiddenActions: [
      "Do not promote live checkout from test-mode success alone.",
      "Do not run a live payment without Ben's explicit go-live phrase."
    ],
    proofRequired: [
      "Live webhook endpoint exists and subscribes to checkout.session.completed, customer.subscription.updated, and customer.subscription.deleted.",
      "Live price IDs resolve in the app environment.",
      "Billing portal settings are configured before /dashboard/billing is treated as live."
    ],
    stopCondition: "Stop if live webhook, live secret, or live price ID proof is incomplete.",
    notes: "This is the money switch. Do not infer approval from test-mode success."
  },
  {
    order: 5,
    key: "crucible-provider-test",
    title: "Crucible identity/funds provider test",
    gatePhrase: "APPROVE CRUCIBLE PROVIDER TEST",
    status: "operator_gate",
    operatorUrl: "https://dashboard.stripe.com/identity/application",
    localRoutes: ["/dashboard/crucible", "/dashboard/profile"],
    benAction: "Approve any provider account/session setup for identity or funds testing.",
    agentPrep: [
      "Show the local Crucible readiness state.",
      "Clarify what receipt or provider result will count as proof.",
      "Keep legal/trust copy conservative."
    ],
    forbiddenActions: [
      "Do not open a paid or live provider session.",
      "Do not imply clearance, guarantee, or legal approval."
    ],
    proofRequired: [
      "Provider account/session access is ready.",
      "Provider test mode is understood.",
      "Receipt expectations are clear before any user-facing check is opened.",
      "Copy does not imply clearance, trust guarantee, or legal approval."
    ],
    stopCondition: "Stop at provider account, OAuth, billing, secret, or final create/activate approval.",
    notes: "Identity/funds provider testing is separate from live background checks."
  },
  {
    order: 6,
    key: "background-fcra",
    title: "Background-check/FCRA readiness",
    gatePhrase: null,
    status: "blocked",
    operatorUrl: null,
    localRoutes: ["/dashboard/crucible", "/pricing"],
    benAction: "Bring counsel/provider approval before Werkles collects consent or starts background checks.",
    agentPrep: [
      "Keep background checks marked blocked.",
      "Prepare the list of policy documents and process decisions needed.",
      "Keep user-facing copy explicit that this is not active."
    ],
    forbiddenActions: [
      "Do not collect background-check consent.",
      "Do not start a provider background check.",
      "Do not store sensitive background-check artifacts."
    ],
    proofRequired: [
      "Counsel-reviewed consent flow.",
      "Adverse-action and dispute process.",
      "Data retention/deletion policy.",
      "Provider selection and permitted-use review.",
      "Ben approval after the above exists."
    ],
    stopCondition: "Do not collect background-check consent or start a live background check before counsel/provider approval.",
    notes: "This is intentionally not a one-click knockout gate yet."
  },
  {
    order: 7,
    key: "production-rollout",
    title: "Production rollout",
    gatePhrase: "APPROVE PRODUCTION ROLLOUT",
    status: "operator_gate",
    operatorUrl: "https://vercel.com/dashboard",
    localRoutes: ["/", "/membership", "/dashboard/billing", "/dashboard/crucible"],
    benAction: "Approve deploy, production rollout, and any public launch or production mutation.",
    agentPrep: [
      "Run route-level smoke checks.",
      "Summarize which payment/provider gates are complete or scoped out.",
      "Prepare rollback and verification notes."
    ],
    forbiddenActions: [
      "Do not deploy, push, merge, or mutate production data.",
      "Do not run production SQL.",
      "Do not make public launch changes without approval."
    ],
    proofRequired: [
      "Payment gates above are complete or explicitly scoped out.",
      "Provider gates above are complete or explicitly scoped out.",
      "Production env vars are configured privately.",
      "Route smoke tests pass.",
      "Ben approves deploy/push/production rollout."
    ],
    stopCondition: "No deploy, push, merge, SQL, secrets, production data mutation, or public launch without explicit approval.",
    notes: "Production rollout is last, not a substitute for payment/provider gates."
  }
];

export function productHumanGatesFor(area: ProductHumanGate["area"]) {
  return productHumanGates.filter((gate) => gate.area === area);
}

export function productGateStatusLabel(status: ProductHumanGateStatus) {
  if (status === "ready_for_review") return "Ready for Ben review";
  if (status === "operator_gate") return "Human Gate";
  return "Blocked";
}
