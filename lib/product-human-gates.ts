import { stripeManifest } from "@/lib/stripe-manifest";

export type ProductHumanGateStatus = "ready_for_review" | "operator_gate" | "blocked" | "completed";

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
  state: "ready_to_review" | "needs_prior_gate" | "policy_blocked" | "last_only" | "completed";
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

export type ProductGateHandoffItem = {
  title: string;
  detail: string;
  route: string;
};

export type ProductGateRecapSection = {
  title: string;
  fields: string[];
};

export type ProductGateRisk = {
  key: string;
  title: string;
  severity: "high" | "medium" | "blocked";
  appliesTo: string[];
  risk: string;
  mitigation: string;
  readySignal: string;
};

export type ProductGateBlockerStep = {
  title: string;
  action: string;
  mustNotDo: string;
};

export type ProductProviderConsoleLink = {
  provider: string;
  title: string;
  url: string;
  purpose: string;
  gate: string;
  blockedBy: string;
};

export type ProductGateSignInTier =
  | "tier_0_infra"
  | "tier_1_money"
  | "tier_2_crucible"
  | "tier_3_crucible_extended"
  | "tier_4_fcra"
  | "tier_5_repo"
  | "tier_6_discovery"
  | "optional";

export type ProductGateCredentialStatus =
  | "completed"
  | "collect_now"
  | "collect_planning"
  | "policy_blocked"
  | "optional"
  | "paused";

export type ProductGateCredentialTarget = {
  id: string;
  tier: number;
  tierLabel: string;
  provider: string;
  url: string;
  loginMethods: string;
  gatePhrase: string | null;
  status: ProductGateCredentialStatus;
  onePasswordVault: string | null;
  onePasswordItem: string | null;
  fieldsToStore: string[];
  crewAction: string;
  forbiddenUntil: string;
};

export type ProductGateSignInTarget = {
  order: number;
  tier: ProductGateSignInTier;
  tierLabel: string;
  provider: string;
  url: string;
  gatePhrase: string | null;
  authenticatorNote: string;
};

export type ProductGateSecretEntryItem = {
  name: string;
  destination: string;
  purpose: string;
  valueRule: string;
  proof: string;
};

export type ProductGateWebhookEvent = {
  eventName: string;
  mode: "test" | "live";
  purpose: string;
  requiredFor: string[];
  proof: string;
  stopIfMissing: string;
};

export type ProductGateLiveCheckoutSmokeStep = {
  order: number;
  title: string;
  actor: "Ben" | "Agent" | "Both";
  proof: string;
  mustNotDo: string;
};

export type ProductGateProviderScopeItem = {
  provider: string;
  scope: string;
  allowedPrep: string;
  approvalNeeded: string;
  stopCondition: string;
};

export type ProductGateFcraPolicyItem = {
  topic: string;
  requiredProof: string;
  blockedAction: string;
  owner: string;
};

export type ProductGateRolloutReadinessItem = {
  title: string;
  proof: string;
  rollback: string;
  stopCondition: string;
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
    status: "review_now",
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
    status: "review_now",
    dependsOn: ["stripe-test-checkout-webhook"],
    skipRisk: "Extended Crucible providers (phone, license, reference) still need separate setup phrases.",
    unlocks: ["crucible-phone-provider", "crucible-reference-provider", "crucible-license-provider"],
    nextAllowedAction: "HG-2 approved. Extended provider setup phrases unlock Tier 3 logins."
  },
  {
    gateKey: "crucible-phone-provider",
    status: "blocked_by_prior_gate",
    dependsOn: ["crucible-provider-test"],
    skipRisk: "SMS verification before Twilio scope approval can send messages or incur spend.",
    unlocks: [],
    nextAllowedAction: "Collect Twilio login only. Stop at Verify service create or SMS send."
  },
  {
    gateKey: "crucible-reference-provider",
    status: "blocked_by_prior_gate",
    dependsOn: ["crucible-provider-test"],
    skipRisk: "Reference checks before provider scope approval can collect PII without workflow.",
    unlocks: [],
    nextAllowedAction: "Collect Checkr login for planning. Stop at candidate or report create."
  },
  {
    gateKey: "crucible-license-provider",
    status: "blocked_by_prior_gate",
    dependsOn: ["crucible-provider-test"],
    skipRisk: "License lookups before vendor selection can imply clearance without API proof.",
    unlocks: [],
    nextAllowedAction: "Document state vendor options. Stop at paid check launch."
  },
  {
    gateKey: "discovery-response-go-live",
    status: "blocked_by_prior_gate",
    dependsOn: ["stripe-test-checkout-webhook"],
    skipRisk: "Public discovery SLA without operator read capacity creates false promise of response.",
    unlocks: [],
    nextAllowedAction: "No new login. Formalize operator turnaround when Ben gives discovery phrase."
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
    title: "Sign-In Hunt",
    href: "/operator/gate-knockout/sign-in-hunt",
    purpose: "Ordered provider login list for Human Gate sessions.",
    useWhen: "Use when Ben needs to open consoles in gate order."
  },
  {
    title: "Credential Handoff",
    href: "/operator/gate-knockout/credential-handoff",
    purpose: "Full tier list for password collection crew — logins, 1Password targets, gate phrases, and status.",
    useWhen: "Hand off to credential crew before a gate session or provider onboarding sprint."
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
  },
  {
    title: "Ben Handoff",
    href: "/operator/gate-knockout/handoff",
    purpose: "One-page packet for what Ben needs before sitting down to pass Human Gates.",
    useWhen: "Use when scheduling the actual Human Gate session."
  },
  {
    title: "Session Recap",
    href: "/operator/gate-knockout/recap",
    purpose: "Post-session template for what passed, what stayed blocked, and what changed.",
    useWhen: "Use immediately after the Human Gate session."
  },
  {
    title: "Risk Register",
    href: "/operator/gate-knockout/risks",
    purpose: "Remaining Stripe, provider, background-check, and production risks in one place.",
    useWhen: "Use before declaring the site ready for live gate passage."
  },
  {
    title: "Stripe Blocker",
    href: "/operator/gate-knockout/stripe-blocked",
    purpose: "What to do while Stripe login/password recovery blocks live product work.",
    useWhen: "Use when Stripe auth prevents live product, webhook, or secret verification."
  },
  {
    title: "Stripe Offline Prep",
    href: "/operator/gate-knockout/stripe-offline",
    purpose: "Names, prices, modes, and env vars to prepare before Stripe access is restored.",
    useWhen: "Use while waiting for Stripe login to recover."
  },
  {
    title: "Provider Queue",
    href: "/operator/gate-knockout/provider-queue",
    purpose: "External provider console links and gate blockers for Supabase, Vercel, Stripe, Plaid, Twilio, and Checkr.",
    useWhen: "Use to keep non-Stripe provider work organized without crossing gates."
  },
  {
    title: "Secret Entry Checklist",
    href: "/operator/gate-knockout/secret-entry",
    purpose: "Names-only checklist for private Stripe and hosting env entry.",
    useWhen: "Use when Ben is ready to enter values privately."
  },
  {
    title: "Webhook Matrix",
    href: "/operator/gate-knockout/webhook-matrix",
    purpose: "Test and live Stripe webhook events required for checkout and membership proof.",
    useWhen: "Use before approving test checkout, live checkout, or production rollout."
  },
  {
    title: "Test Checkout Smoke",
    href: "/operator/gate-knockout/test-checkout-smoke",
    purpose: "Active Gate 1 checklist: test Stripe checkout, webhook proof, and membership state update.",
    useWhen: "Use now that tier-A env is 8/8 and checkout is unpaused in test mode."
  },
  {
    title: "Test Crucible Smoke",
    href: "/operator/gate-knockout/test-crucible-smoke",
    purpose: "Gate 2 checklist: identity + funds provider test on /dashboard/crucible after active membership.",
    useWhen: "Use after Gate 1 test checkout proof or when member + active is already webhook-backed."
  },
  {
    title: "Live Checkout Smoke",
    href: "/operator/gate-knockout/live-checkout-smoke",
    purpose: "First live transaction smoke plan with Ben/agent split and hard stops.",
    useWhen: "Use only after live Stripe products, secrets, and webhooks are approved."
  },
  {
    title: "Provider Test Scope",
    href: "/operator/gate-knockout/provider-scope",
    purpose: "Defines exactly what provider prep is allowed before identity, funds, or background-check sessions.",
    useWhen: "Use before any Crucible provider test or provider dashboard work."
  },
  {
    title: "FCRA Policy Gate",
    href: "/operator/gate-knockout/fcra-policy",
    purpose: "Background-check policy blockers, required proof, and forbidden actions.",
    useWhen: "Use before any background-check copy, consent, provider start, or result storage."
  },
  {
    title: "Rollout Readiness",
    href: "/operator/gate-knockout/rollout-readiness",
    purpose: "Production rollout proof, rollback notes, and hard stops in one checklist.",
    useWhen: "Use last, after upstream gates are approved or explicitly scoped out."
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
    proof: "Foundry Dues plans render; test checkout button is enabled (tier-A env ready).",
    mustNotDo: "Do not switch live Stripe keys or treat success-page redirect as webhook proof."
  },
  {
    order: 3,
    title: "Confirm billing readiness",
    route: "/dashboard/billing",
    proof: "Billing state loads; test portal path available when signed in.",
    mustNotDo: "Do not open live customer portal or manually patch membership state."
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
    title: "Confirm sign-in hunt list",
    route: "/operator/gate-knockout/sign-in-hunt",
    proof: "Ordered provider login targets render for v0 ship tier.",
    mustNotDo: "Do not paste credentials or secret values into chat."
  },
  {
    order: 7,
    title: "Run test checkout smoke checklist",
    route: "/operator/gate-knockout/test-checkout-smoke",
    proof: "Gate 1 smoke steps visible; webhook matrix linked for event names.",
    mustNotDo: "Do not record APPROVE PAID CHECKOUT GO-LIVE (test mode) without webhook proof."
  },
  {
    order: 8,
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
    evidence: "Tier-A env 8/8 on Preview and Production; test checkout routes unpaused.",
    blocker: "Ben must review test checkout + webhook proof before live steps.",
    nextAction: "Run test checkout smoke from /membership; confirm webhook-backed profile update."
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
    state: "ready_to_review",
    evidence: "Sandbox Crucible unlocked; Stripe Identity redirect + webhook handlers; Plaid Link when PLAID_* env set.",
    blocker: "Requires active Foundry membership and Stripe Identity enabled on test account.",
    nextAction: "Run identity + funds from /dashboard/crucible; add identity.* webhook events in Stripe test dashboard."
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
    state: "completed",
    evidence: "APPROVE PRODUCTION ROLLOUT recorded 2026-07-05; tier-A env redeploy live on werkles.com.",
    blocker: "None for tier-A env redeploy. Live Stripe and Crucible remain gated.",
    nextAction: "Next gate is test checkout webhook proof or live Stripe gates — not another env redeploy."
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

export const productGateHandoffItems: ProductGateHandoffItem[] = [
  {
    title: "Start with the scorecard",
    detail: "Use the shortest readiness view to choose which gate Ben should review first.",
    route: "/operator/gate-knockout/scorecard"
  },
  {
    title: "Confirm dependencies",
    detail: "Make sure no live or production gate is being reviewed before its upstream gate is settled.",
    route: "/operator/gate-knockout/dependencies"
  },
  {
    title: "Run preflight",
    detail: "Confirm route proof, env names, provider boundaries, and production stop conditions before the session.",
    route: "/operator/gate-knockout/preflight"
  },
  {
    title: "Use the decision packet",
    detail: "Record each outcome with proof references and redactions, not secret values or private payloads.",
    route: "/operator/gate-knockout/decision-packet"
  },
  {
    title: "Check the evidence index",
    detail: "Do not accept proof that the evidence index marks as insufficient or unsafe.",
    route: "/operator/gate-knockout/evidence"
  },
  {
    title: "End with recap",
    detail: "Summarize passed gates, blocked gates, scoped-out gates, and the next live-risk item.",
    route: "/operator/gate-knockout/recap"
  }
];

export const productGateRecapSections: ProductGateRecapSection[] = [
  {
    title: "Passed gates",
    fields: ["Gate title", "Exact phrase used", "Proof reference", "What changed in product readiness"]
  },
  {
    title: "Blocked gates",
    fields: ["Gate title", "Stop condition", "Missing proof", "Owner for next proof"]
  },
  {
    title: "Scoped-out gates",
    fields: ["Gate title", "Scope decision", "What remains visible", "What remains disabled"]
  },
  {
    title: "Safety confirmations",
    fields: ["No secrets exposed", "No provider PII exposed", "No background-check artifacts stored", "No production mutation without approval"]
  },
  {
    title: "Next session",
    fields: ["Next gate to review", "Proof needed before review", "External dashboard/provider needed", "Ben-only action needed"]
  }
];

export const productGateRiskRegister: ProductGateRisk[] = [
  {
    key: "webhook-membership-source",
    title: "Webhook-backed membership state",
    severity: "high",
    appliesTo: ["stripe-test-checkout-webhook", "stripe-live-checkout"],
    risk: "Checkout success without webhook-backed membership state can make paid status unreliable.",
    mitigation: "Prove checkout and webhook receipt update profile membership state before any live checkout gate.",
    readySignal: "Test webhook proof is accepted and billing state reflects webhook source of truth."
  },
  {
    key: "live-secret-handling",
    title: "Live secret handling",
    severity: "high",
    appliesTo: ["stripe-live-secret-entry", "production-rollout"],
    risk: "Secrets pasted into chat, commits, logs, or receipts would compromise live systems.",
    mitigation: "Ben enters values privately; agents refer only to env var names.",
    readySignal: "Decision packet confirms names only and no values exposed."
  },
  {
    key: "provider-claims",
    title: "Provider result and trust claims",
    severity: "medium",
    appliesTo: ["crucible-provider-test"],
    risk: "Product copy could imply identity/funds clearance before provider proof exists.",
    mitigation: "Keep copy conservative and receipt-based; no guarantees or clearance language.",
    readySignal: "Provider test scope and receipt expectations are approved."
  },
  {
    key: "background-fcra",
    title: "Background-check/FCRA compliance",
    severity: "blocked",
    appliesTo: ["background-fcra"],
    risk: "Background checks without counsel/provider approval create consent, adverse-action, retention, and permitted-use exposure.",
    mitigation: "Keep background checks blocked until counsel/provider approval exists.",
    readySignal: "FCRA policy proof exists for consent, adverse action, retention, permitted use, and disputes."
  },
  {
    key: "production-rollout-order",
    title: "Production rollout order",
    severity: "high",
    appliesTo: ["production-rollout"],
    risk: "Production launch before gates are passed or scoped out exposes unfinished money/provider/compliance behavior.",
    mitigation: "Require route smoke proof, rollback note, scoped-out list, and APPROVE PRODUCTION ROLLOUT.",
    readySignal: "All upstream gates are approved or scoped out and production phrase is recorded."
  }
];

export const productStripeBlockedSteps: ProductGateBlockerStep[] = [
  {
    title: "Recover Stripe access manually",
    action: "Use Stripe password/passkey/SSO recovery outside the agent. Treat login, 2FA, passkeys, and account recovery as Ben-only.",
    mustNotDo: "Do not ask an agent to enter credentials, recovery codes, passkeys, or email links."
  },
  {
    title: "Keep building local proof",
    action: "Use pricing, membership, billing, preflight, dependency, and evidence pages to prepare every proof item that does not require Stripe login.",
    mustNotDo: "Do not infer live Stripe approval from local readiness."
  },
  {
    title: "Prepare Stripe product mapping offline",
    action: "Use the Stripe Offline Prep page to compare product names, prices, modes, and environment variable names before opening the dashboard.",
    mustNotDo: "Do not invent live price IDs or mark live products created before Stripe dashboard proof exists."
  },
  {
    title: "Defer live gates cleanly",
    action: "Record Stripe live products, secret entry, live checkout, and production rollout as BLOCKED until Stripe access is restored.",
    mustNotDo: "Do not proceed to production rollout while Stripe live proof is missing."
  }
];

export const productProviderConsoleLinks: ProductProviderConsoleLink[] = [
  {
    provider: "Supabase",
    title: "Projects",
    url: "https://supabase.com/dashboard/projects",
    purpose: "Auth project, redirect URL, email template, and API key review.",
    gate: "Supabase auth/url/key provider gate",
    blockedBy: "Ben login and private key entry."
  },
  {
    provider: "Vercel",
    title: "Dashboard",
    url: "https://vercel.com/dashboard",
    purpose: "Private environment variable entry and production deployment settings.",
    gate: "APPROVE SECRET ENTRY / APPROVE PRODUCTION ROLLOUT",
    blockedBy: "Ben-only secrets and deploy approval."
  },
  {
    provider: "Stripe",
    title: "Products",
    url: "https://dashboard.stripe.com/products",
    purpose: "Live product and price creation after pricing review.",
    gate: "APPROVE LIVE STRIPE PRODUCT CREATE",
    blockedBy: "Stripe login/password recovery and test checkout proof."
  },
  {
    provider: "Stripe",
    title: "Test products",
    url: "https://dashboard.stripe.com/test/products",
    purpose: "Test product/price setup before live work.",
    gate: "APPROVE STRIPE PRODUCT PREP",
    blockedBy: "Stripe login/password recovery."
  },
  {
    provider: "Stripe",
    title: "Live webhooks",
    url: "https://dashboard.stripe.com/webhooks",
    purpose: "Live webhook endpoint and event subscription review.",
    gate: "APPROVE PAID CHECKOUT GO-LIVE",
    blockedBy: "Live secret entry and live price IDs."
  },
  {
    provider: "Stripe",
    title: "Test webhooks",
    url: "https://dashboard.stripe.com/test/webhooks",
    purpose: "Test webhook endpoint and event subscription proof.",
    gate: "APPROVE PAID CHECKOUT GO-LIVE (test mode)",
    blockedBy: "Stripe login/password recovery."
  },
  {
    provider: "Stripe",
    title: "Customer portal settings",
    url: "https://dashboard.stripe.com/settings/billing/portal",
    purpose: "Customer portal configuration before billing portal is live.",
    gate: "APPROVE PAID CHECKOUT GO-LIVE",
    blockedBy: "Stripe login and live product/customer setup."
  },
  {
    provider: "Stripe Identity",
    title: "Identity application",
    url: "https://dashboard.stripe.com/identity/application",
    purpose: "Identity provider test configuration.",
    gate: "APPROVE CRUCIBLE PROVIDER TEST",
    blockedBy: "Provider account/session approval."
  },
  {
    provider: "Plaid",
    title: "Dashboard",
    url: "https://dashboard.plaid.com/",
    purpose: "Funds verification provider setup for Plaid Assets.",
    gate: "Future funds provider gate",
    blockedBy: "Explicit Plaid setup approval and private credentials."
  },
  {
    provider: "Twilio",
    title: "Console",
    url: "https://console.twilio.com/",
    purpose: "Phone verification provider setup for Twilio Verify.",
    gate: "Future phone provider gate",
    blockedBy: "Explicit Twilio setup approval and private credentials."
  },
  {
    provider: "Checkr",
    title: "Dashboard",
    url: "https://dashboard.checkr.com/",
    purpose: "Reference, employment, and background-check provider setup.",
    gate: "Background-check/FCRA provider gate",
    blockedBy: "Counsel/provider/FCRA approval."
  }
];

export const productGateCredentialHandoff: ProductGateCredentialTarget[] = [
  {
    id: "1password-operator",
    tier: 0,
    tierLabel: "Tier 0 — Infrastructure shell",
    provider: "1Password (operator + automation)",
    url: "https://my.1password.com/",
    loginMethods: "Master password + account unlock; service account token in Windows Credential Manager on Betsy",
    gatePhrase: null,
    status: "completed",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets (+ service account item)",
    fieldsToStore: ["OP_SERVICE_ACCOUNT_TOKEN", "All tier-A + Plaid field names in Werkles Vercel Secrets"],
    crewAction: "Confirm Ben can unlock 1Password desktop app and CLI integration is on. Do not rotate service account without Ben.",
    forbiddenUntil: "Never paste values into chat, repo, or receipts."
  },
  {
    id: "supabase",
    tier: 0,
    tierLabel: "Tier 0 — Infrastructure shell",
    provider: "Supabase",
    url: "https://supabase.com/dashboard/projects",
    loginMethods: "Email, GitHub, or SSO; 2FA if enabled",
    gatePhrase: "PROVIDER LOGIN DONE",
    status: "completed",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets",
    fieldsToStore: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY"
    ],
    crewAction: "Collect login. Confirm project access. Keys already synced — verify 2FA recovery.",
    forbiddenUntil: "No SQL migrations or auth URL changes without Ben gate."
  },
  {
    id: "vercel",
    tier: 0,
    tierLabel: "Tier 0 — Infrastructure shell",
    provider: "Vercel",
    url: "https://vercel.com/login",
    loginMethods: "GitHub, email, or SSO; team werkles / project werkles1",
    gatePhrase: "APPROVE SECRET ENTRY",
    status: "completed",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets",
    fieldsToStore: ["All tier-A env var names", "Plaid fields when syncing"],
    crewAction: "Collect login with access to werkles/werkles1 Production + Preview env settings.",
    forbiddenUntil: "No production deploy or live key swap without explicit phrase."
  },
  {
    id: "stripe-master",
    tier: 1,
    tierLabel: "Tier 1 — Money path (Stripe)",
    provider: "Stripe (master login — test + live + Identity)",
    url: "https://dashboard.stripe.com/login",
    loginMethods: "Email/password + authenticator, passkey, Google, or SSO",
    gatePhrase: "APPROVE STRIPE PRODUCT PREP",
    status: "collect_now",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets",
    fieldsToStore: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID",
      "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID",
      "STRIPE_CRUCIBLE_* price IDs (see lib/stripe-manifest.ts)"
    ],
    crewAction: "One login covers all Stripe sub-consoles below. Store in 1Password Login item + secret fields separately.",
    forbiddenUntil: "No live product create without APPROVE LIVE STRIPE PRODUCT CREATE."
  },
  {
    id: "stripe-test-webhooks",
    tier: 1,
    tierLabel: "Tier 1 — Money path (Stripe)",
    provider: "Stripe — test webhooks",
    url: "https://dashboard.stripe.com/test/webhooks",
    loginMethods: "Same Stripe login",
    gatePhrase: "APPROVE PAID CHECKOUT GO-LIVE (test mode)",
    status: "completed",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets",
    fieldsToStore: ["STRIPE_WEBHOOK_SECRET (test endpoint whsec_*)"],
    crewAction: "Approved 2026-07-07. Endpoint we_1Tq0y6BzNBvy0VkUWOJLgD6l → werkles.com/api/webhooks/stripe.",
    forbiddenUntil: "Test mode only until live checkout gate."
  },
  {
    id: "stripe-live-products",
    tier: 1,
    tierLabel: "Tier 1 — Money path (Stripe)",
    provider: "Stripe — live products & prices",
    url: "https://dashboard.stripe.com/products",
    loginMethods: "Same Stripe login; toggle Test mode OFF",
    gatePhrase: "APPROVE LIVE STRIPE PRODUCT CREATE",
    status: "collect_now",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets",
    fieldsToStore: [
      "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID (live)",
      "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID (live)",
      "STRIPE_CRUCIBLE_* live price IDs when Crucible paid checks ship"
    ],
    crewAction: "Phrase approved 2026-07-23. Ben creates live Foundry Dues products; crew does not click create/save. Next: APPROVE SECRET ENTRY after IDs exist in 1Password.",
    forbiddenUntil: "Crew must not enter credentials or paste price IDs into chat. HG-4/HG-5 still gated."
  },
  {
    id: "stripe-live-webhooks",
    tier: 1,
    tierLabel: "Tier 1 — Money path (Stripe)",
    provider: "Stripe — live webhooks + billing portal",
    url: "https://dashboard.stripe.com/webhooks",
    loginMethods: "Same Stripe login; live mode",
    gatePhrase: "APPROVE PAID CHECKOUT GO-LIVE",
    status: "collect_planning",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets",
    fieldsToStore: ["STRIPE_SECRET_KEY (sk_live_*)", "STRIPE_WEBHOOK_SECRET (live whsec_*)"],
    crewAction: "Also collect portal settings URL: dashboard.stripe.com/settings/billing/portal",
    forbiddenUntil: "Blocked until live products + APPROVE SECRET ENTRY."
  },
  {
    id: "plaid",
    tier: 2,
    tierLabel: "Tier 2 — Crucible core providers",
    provider: "Plaid",
    url: "https://dashboard.plaid.com/",
    loginMethods: "Email/password; 2FA if enabled",
    gatePhrase: "APPROVE CRUCIBLE PROVIDER TEST",
    status: "completed",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets",
    fieldsToStore: ["PLAID_CLIENT_ID", "PLAID_SECRET", "PLAID_ENV"],
    crewAction: "Approved 2026-07-07. Sandbox keys synced. Collect login for future production key rotation.",
    forbiddenUntil: "Production Plaid keys require separate Ben approval."
  },
  {
    id: "stripe-identity",
    tier: 2,
    tierLabel: "Tier 2 — Crucible core providers",
    provider: "Stripe Identity",
    url: "https://dashboard.stripe.com/identity/application",
    loginMethods: "Same Stripe login",
    gatePhrase: "APPROVE CRUCIBLE PROVIDER TEST",
    status: "completed",
    onePasswordVault: null,
    onePasswordItem: null,
    fieldsToStore: [],
    crewAction: "Approved 2026-07-07. Enable Identity application in Stripe for live redirect (optional upgrade from stub).",
    forbiddenUntil: "No live identity claims without provider test scope."
  },
  {
    id: "twilio",
    tier: 3,
    tierLabel: "Tier 3 — Crucible extended (future)",
    provider: "Twilio Verify",
    url: "https://console.twilio.com/",
    loginMethods: "Email/password + 2FA",
    gatePhrase: "APPROVE CRUCIBLE PHONE PROVIDER SETUP",
    status: "collect_planning",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets (future fields)",
    fieldsToStore: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"],
    crewAction: "Collect login for planning. Phone check UI exists; API not wired.",
    forbiddenUntil: "No SMS send or Verify service create without phrase."
  },
  {
    id: "checkr-reference",
    tier: 3,
    tierLabel: "Tier 3 — Crucible extended (future)",
    provider: "Checkr — reference & employment",
    url: "https://dashboard.checkr.com/",
    loginMethods: "Email/password; employer onboarding may apply",
    gatePhrase: "APPROVE CRUCIBLE REFERENCE PROVIDER SETUP",
    status: "collect_planning",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets (future fields)",
    fieldsToStore: ["CHECKR_API_KEY", "CHECKR_WEBHOOK_SECRET"],
    crewAction: "Collect login for reference/employment prep only — not background tier yet.",
    forbiddenUntil: "No candidate create, consent, or report order without phrase."
  },
  {
    id: "license-vendors",
    tier: 3,
    tierLabel: "Tier 3 — Crucible extended (future)",
    provider: "State / county license lookup vendors",
    url: "https://werkles.com/pricing",
    loginMethods: "Varies by state board API vendor (TBD)",
    gatePhrase: "APPROVE CRUCIBLE LICENSE PROVIDER SETUP",
    status: "collect_planning",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "TBD per vendor",
    fieldsToStore: ["Per-vendor API keys when selected"],
    crewAction: "No vendor selected yet. Track hospitality states (liquor, food handler, contractor) when Ben picks vendor.",
    forbiddenUntil: "No paid license check launch without phrase."
  },
  {
    id: "checkr-background",
    tier: 4,
    tierLabel: "Tier 4 — Background / FCRA (policy-blocked)",
    provider: "Checkr — background tiers",
    url: "https://dashboard.checkr.com/",
    loginMethods: "Same Checkr account as Tier 3 if used",
    gatePhrase: null,
    status: "policy_blocked",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Werkles Vercel Secrets (future)",
    fieldsToStore: ["CHECKR_API_KEY", "CHECKR_PACKAGE_IDS"],
    crewAction: "May collect login for planning. Do NOT start checks, consent flows, or store reports.",
    forbiddenUntil: "Counsel-reviewed FCRA flow + Ben approval after policy proof."
  },
  {
    id: "github-web",
    tier: 5,
    tierLabel: "Tier 5 — Repo / merge",
    provider: "GitHub (web)",
    url: "https://github.com/login",
    loginMethods: "Email/password, passkey, or SSO; org benleakwerkles/Werkles",
    gatePhrase: null,
    status: "collect_now",
    onePasswordVault: null,
    onePasswordItem: "Ben personal vault — GitHub login",
    fieldsToStore: ["GitHub username/password or SSO identity", "PAT only if Ben explicitly requests gh automation"],
    crewAction: "Collect for push/PR/merge gates. Canonical guard may block push until merge resolved.",
    forbiddenUntil: "No push to main or force push without explicit Ben gate."
  },
  {
    id: "github-cli",
    tier: 5,
    tierLabel: "Tier 5 — Repo / merge",
    provider: "GitHub CLI (gh)",
    url: "https://cli.github.com/manual/gh_auth_login",
    loginMethods: "Separate from web session — gh auth login on Betsy",
    gatePhrase: null,
    status: "collect_now",
    onePasswordVault: null,
    onePasswordItem: "Ben personal vault or machine keyring",
    fieldsToStore: ["gh auth token on Betsy"],
    crewAction: "Verify gh auth status on Betsy: gh auth status",
    forbiddenUntil: "Same as GitHub web."
  },
  {
    id: "discovery-operator",
    tier: 6,
    tierLabel: "Tier 6 — Discovery (no new provider login)",
    provider: "Werkles Discovery queue (operator)",
    url: "https://werkles.com/discovery",
    loginMethods: "No new vendor — uses Supabase + operator human read",
    gatePhrase: "APPROVE DISCOVERY RESPONSE GO-LIVE",
    status: "collect_planning",
    onePasswordVault: null,
    onePasswordItem: null,
    fieldsToStore: [],
    crewAction: "No password to collect. Gate formalizes operator SLA for /discovery intake response.",
    forbiddenUntil: "Phrase not yet in APPROVAL_LOG — prep only."
  },
  {
    id: "google-oauth",
    tier: 7,
    tierLabel: "Tier 7 — Optional",
    provider: "Google Cloud (OAuth)",
    url: "https://console.cloud.google.com/apis/credentials",
    loginMethods: "Google account; OAuth consent screen admin",
    gatePhrase: "APPROVE SUPABASE GOOGLE OAUTH",
    status: "optional",
    onePasswordVault: "Werkles Automation",
    onePasswordItem: "Google OAuth client (future)",
    fieldsToStore: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"],
    crewAction: "Only if enabling Google sign-in in Supabase. App currently email/password only.",
    forbiddenUntil: "Optional future social auth."
  },
  {
    id: "render-ghost-forge",
    tier: 7,
    tierLabel: "Tier 7 — Optional",
    provider: "Render (Ghost Forge)",
    url: "https://dashboard.render.com/",
    loginMethods: "Email/GitHub",
    gatePhrase: "RESUME_GATE_05_* or new render batch GO",
    status: "paused",
    onePasswordVault: null,
    onePasswordItem: null,
    fieldsToStore: ["RENDER_API_KEY if batch scripts need it"],
    crewAction: "Gate 05 PAUSE — no spend. Collect only if Ben resumes Ghost Forge renders.",
    forbiddenUntil: "Ghost Forge hourly cap / budget gate."
  },
  {
    id: "credit-bureau",
    tier: 7,
    tierLabel: "Tier 7 — Optional",
    provider: "Credit bureau partner (not in stack)",
    url: "https://werkles.com/pricing",
    loginMethods: "N/A — not wired",
    gatePhrase: null,
    status: "optional",
    onePasswordVault: null,
    onePasswordItem: null,
    fieldsToStore: [],
    crewAction: "Skip unless Ben adds credit pull product. Plaid is not a credit bureau.",
    forbiddenUntil: "Not in product roadmap yet."
  }
];

export const productGateSignInHunt: ProductGateSignInTarget[] = productGateCredentialHandoff
  .filter((target) => target.url.startsWith("http"))
  .map((target, index) => ({
    order: index + 1,
    tier:
      target.tier === 0
        ? "tier_0_infra"
        : target.tier === 1
          ? "tier_1_money"
          : target.tier === 2
            ? "tier_2_crucible"
            : target.tier === 3
              ? "tier_3_crucible_extended"
              : target.tier === 4
                ? "tier_4_fcra"
                : target.tier === 5
                  ? "tier_5_repo"
                  : target.tier === 6
                    ? "tier_6_discovery"
                    : "optional",
    tierLabel: target.tierLabel,
    provider: target.provider,
    url: target.url,
    gatePhrase: target.gatePhrase,
    authenticatorNote: `${target.loginMethods} — ${target.crewAction}`
  }));

export const productGateSecretEntryItems: ProductGateSecretEntryItem[] = [
  {
    name: "STRIPE_SECRET_KEY",
    destination: "Hosting environment variable",
    purpose: "Server-side Stripe API calls.",
    valueRule: "Secret value. Ben enters privately. Agents may only reference the variable name.",
    proof: "Decision packet records name entered privately, never the value."
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    destination: "Hosting environment variable",
    purpose: "Stripe webhook signature verification.",
    valueRule: "Secret value. Ben enters privately after webhook endpoint exists.",
    proof: "Decision packet records webhook signing secret name entered privately."
  },
  ...stripeManifest.products.map((product) => ({
    name: product.envVar,
    destination: "Hosting environment variable",
    purpose: `${product.name} ${product.mode} price ID (${product.displayPrice}).`,
    valueRule: "Identifier value. Record only after Stripe dashboard proof; do not invent or guess IDs.",
    proof: `Proof references ${product.name} and its matching Stripe price object without private payloads.`
  })),
  {
    name: "STRIPE_MONTHLY_PRICE_ID",
    destination: "Hosting environment variable",
    purpose: "Legacy fallback for monthly Foundry Dues checkout.",
    valueRule: "Identifier value. Keep aligned with STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID or remove after migration.",
    proof: "Decision packet states whether legacy fallback is used or intentionally unused."
  },
  {
    name: "STRIPE_YEARLY_PRICE_ID",
    destination: "Hosting environment variable",
    purpose: "Legacy fallback for annual Foundry Dues checkout.",
    valueRule: "Identifier value. Keep aligned with STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID or remove after migration.",
    proof: "Decision packet states whether legacy fallback is used or intentionally unused."
  }
];

export const productGateWebhookEvents: ProductGateWebhookEvent[] = [
  {
    eventName: "checkout.session.completed",
    mode: "test",
    purpose: "Proves test checkout completion reaches the app before membership state changes.",
    requiredFor: ["stripe-test-checkout-webhook"],
    proof: "Test event receipt plus membership-state update from webhook source of truth.",
    stopIfMissing: "Do not approve test checkout if success-page redirect is the only proof."
  },
  {
    eventName: "customer.subscription.updated",
    mode: "test",
    purpose: "Proves test subscription changes update billing/membership state.",
    requiredFor: ["stripe-test-checkout-webhook"],
    proof: "Test event receipt and changed membership/billing status.",
    stopIfMissing: "Do not approve live subscriptions if updates are not webhook-backed."
  },
  {
    eventName: "customer.subscription.deleted",
    mode: "test",
    purpose: "Proves test cancellation or subscription end can remove or downgrade access.",
    requiredFor: ["stripe-test-checkout-webhook"],
    proof: "Test event receipt and downgraded membership/billing state.",
    stopIfMissing: "Do not approve live checkout if cancellations cannot be handled."
  },
  {
    eventName: "identity.verification_session.verified",
    mode: "test",
    purpose: "Proves Stripe Identity test session completed and updates id_status from webhook.",
    requiredFor: ["crucible-provider-test"],
    proof: "Test identity webhook receipt plus profile id_status sandbox_verified.",
    stopIfMissing: "Do not treat Stripe Identity return URL alone as verification proof."
  },
  {
    eventName: "checkout.session.completed",
    mode: "live",
    purpose: "Proves first live checkout completion reaches the app.",
    requiredFor: ["stripe-live-checkout", "production-rollout"],
    proof: "Live event receipt with customer/payment identifiers redacted.",
    stopIfMissing: "Stop live checkout and production rollout."
  },
  {
    eventName: "customer.subscription.updated",
    mode: "live",
    purpose: "Proves live subscription changes are webhook-backed.",
    requiredFor: ["stripe-live-checkout", "production-rollout"],
    proof: "Live event receipt plus billing state update, with sensitive identifiers redacted.",
    stopIfMissing: "Stop production rollout."
  },
  {
    eventName: "customer.subscription.deleted",
    mode: "live",
    purpose: "Proves live subscription cancellation handling before public launch.",
    requiredFor: ["stripe-live-checkout", "production-rollout"],
    proof: "Live event receipt plus access downgrade proof, with sensitive identifiers redacted.",
    stopIfMissing: "Stop production rollout."
  }
];

export const productGateTestCheckoutPreflight: string[] = [
  "Log in at /login and open /dashboard/profile once — checkout needs a dossier row.",
  "Stripe Dashboard → Test mode ON before you open Checkout.",
  "Confirm a test webhook targets https://werkles.com/api/webhooks/stripe with checkout + subscription events.",
  "At Stripe Checkout use test card 4242 4242 4242 4242 — not your real card.",
  "The success page is not proof. After paying, check Stripe webhook log and /dashboard/billing."
];

export const productGateTestCheckoutSmokeSteps: ProductGateLiveCheckoutSmokeStep[] = [
  {
    order: 1,
    title: "Confirm tier-A env custody",
    actor: "Agent",
    proof: "Test-WerklesVercelSecretItem.ps1 PASS_ALL_FIELDS_VALID (8/8) and Vercel Preview + Production tier-A names encrypted.",
    mustNotDo: "Do not print or paste secret values."
  },
  {
    order: 2,
    title: "Sign in as a real member",
    actor: "Ben",
    proof: "Supabase session opens /dashboard without dev-preview bypass.",
    mustNotDo: "Do not use mock checkout while proving real webhook path."
  },
  {
    order: 3,
    title: "Open Foundry Dues checkout",
    actor: "Both",
    proof: "/membership renders plans; checkout opens Stripe test Checkout (not paused).",
    mustNotDo: "Do not switch to live Stripe keys."
  },
  {
    order: 4,
    title: "Complete test payment",
    actor: "Ben",
    proof: "Stripe test card completes checkout.session.completed in test mode.",
    mustNotDo: "Agents must not enter card or billing details."
  },
  {
    order: 5,
    title: "Verify webhook receipt",
    actor: "Both",
    proof: "Stripe test webhook shows checkout.session.completed (and subscription events as applicable).",
    mustNotDo: "Do not accept /membership/success redirect alone as proof."
  },
  {
    order: 6,
    title: "Verify membership state",
    actor: "Both",
    proof: "/dashboard/billing shows updated membership_tier / subscription_status after webhook — not before.",
    mustNotDo: "Do not manually patch profiles table to fake success."
  },
  {
    order: 7,
    title: "Record test-mode approval",
    actor: "Ben",
    proof: "Ben gives APPROVE PAID CHECKOUT GO-LIVE (test mode) after reviewing webhook-backed state.",
    mustNotDo: "Do not infer live checkout approval from test-mode success."
  }
];

export const productGateCruciblePreflight: string[] = [
  "Complete Gate 1 first — Crucible provider checks require active Foundry membership (member + active).",
  "Log in and open /dashboard/crucible — not the operator runbook alone.",
  "Identity: enable Stripe Identity on your test account, or accept sandbox stub if redirect is unavailable.",
  "Funds: Plaid Link runs in sandbox — follow Plaid test institution flow in the Link UI.",
  "Proof = /dashboard/profile shows id_status and funds_status after webhook or exchange — not the button alone."
];

export const productGateCrucibleSmokeSteps: ProductGateLiveCheckoutSmokeStep[] = [
  {
    order: 1,
    title: "Confirm provider env + mule",
    actor: "Agent",
    proof: "Plaid 3/3 valid in 1Password + Vercel Production; Stripe webhook has 7 events including identity.*; Plaid link_token smoke PASS.",
    mustNotDo: "Do not print secret values."
  },
  {
    order: 2,
    title: "Confirm active membership",
    actor: "Ben",
    proof: "/dashboard/billing shows member + active (from Gate 1 webhook, not manual patch).",
    mustNotDo: "Do not run Crucible checks on a non-member account."
  },
  {
    order: 3,
    title: "Run Identity check",
    actor: "Ben",
    proof: "Identity POST on /dashboard/crucible opens Stripe Identity test redirect OR records sandbox_pending stub.",
    mustNotDo: "Do not treat return URL alone as verified."
  },
  {
    order: 4,
    title: "Run Funds check",
    actor: "Ben",
    proof: "Plaid Link token creation can run in sandbox; public-token exchange and funds-status proof remain disabled until owner-bound encrypted custody exists.",
    mustNotDo: "Do not enter real bank credentials."
  },
  {
    order: 5,
    title: "Verify profile signals",
    actor: "Both",
    proof: "/dashboard/profile reflects id_status and funds_status after webhook or exchange.",
    mustNotDo: "Do not imply clearance or legal approval in copy."
  },
  {
    order: 6,
    title: "Record provider test approval",
    actor: "Ben",
    proof: "Say APPROVE CRUCIBLE PROVIDER TEST after hands proof, or confirm provider test complete.",
    mustNotDo: "Do not open live/paid provider sessions."
  }
];

export const productGateLiveCheckoutSmokeSteps: ProductGateLiveCheckoutSmokeStep[] = [
  {
    order: 1,
    title: "Confirm all upstream Stripe gates",
    actor: "Both",
    proof: "Decision packet shows test checkout/webhook, live products, secret entry, and live webhook setup approved.",
    mustNotDo: "Do not run a live payment while any upstream Stripe gate is BLOCKED or DEFERRED."
  },
  {
    order: 2,
    title: "Open membership checkout path",
    actor: "Agent",
    proof: "Local or staged /membership route renders the selected Foundry Dues plan.",
    mustNotDo: "Do not submit a live payment form or enter payment details."
  },
  {
    order: 3,
    title: "Run first live transaction",
    actor: "Ben",
    proof: "Ben performs the live payment action after giving APPROVE PAID CHECKOUT GO-LIVE.",
    mustNotDo: "Agents must not enter card, customer, passkey, billing, or account details."
  },
  {
    order: 4,
    title: "Verify webhook receipt",
    actor: "Both",
    proof: "Live checkout.session.completed receipt exists and sensitive customer/payment identifiers are redacted.",
    mustNotDo: "Do not accept success-page redirect as sufficient proof."
  },
  {
    order: 5,
    title: "Verify membership state",
    actor: "Both",
    proof: "Billing/member state changes only after webhook proof.",
    mustNotDo: "Do not manually patch membership state to fake checkout success."
  },
  {
    order: 6,
    title: "Record outcome",
    actor: "Agent",
    proof: "Decision packet records outcome, proof references, redactions, and next gate status.",
    mustNotDo: "Do not paste secrets, payment details, customer PII, or private dashboard payloads."
  }
];

export const productGateProviderScopeItems: ProductGateProviderScopeItem[] = [
  {
    provider: "Stripe Identity",
    scope: "Identity re-verification proof for Crucible preview.",
    allowedPrep: "Document provider mode, receipt expectations, pricing, and copy boundaries.",
    approvalNeeded: "APPROVE CRUCIBLE PROVIDER TEST before any session creation or applicant flow.",
    stopCondition: "Stop at account login, OAuth, billing, paid session, live session, or final activate/create."
  },
  {
    provider: "Plaid",
    scope: "Funds verification research and future provider queue only.",
    allowedPrep: "Document intended proof shape and price disclosure from product copy.",
    approvalNeeded: "A future explicit Plaid setup approval before client/app credentials or Link setup.",
    stopCondition: "Stop at credentials, OAuth, account linking, financial data access, or paid/live product enablement."
  },
  {
    provider: "Twilio Verify",
    scope: "Phone verification research and future provider queue only.",
    allowedPrep: "Document when phone verification would be required and what user copy would say.",
    approvalNeeded: "A future explicit Twilio setup approval before service creation or SMS sending.",
    stopCondition: "Stop at credentials, sender setup, billing, phone collection, or outbound message sending."
  },
  {
    provider: "Checkr",
    scope: "Reference, employment, and background-check provider planning only.",
    allowedPrep: "Document FCRA dependencies, consent needs, adverse-action needs, and product blockers.",
    approvalNeeded: "Counsel/provider FCRA approval plus explicit background-check provider gate.",
    stopCondition: "Stop at package creation, candidate creation, consent collection, report order, or result storage."
  }
];

export const productGateFcraPolicyItems: ProductGateFcraPolicyItem[] = [
  {
    topic: "Consent and disclosure",
    requiredProof: "Counsel/provider-approved standalone disclosure and authorization flow.",
    blockedAction: "Collecting background-check consent or implying consent is ready.",
    owner: "Ben plus counsel/provider."
  },
  {
    topic: "Permitted use",
    requiredProof: "Written decision that Werkles has a lawful permitted use for each check type.",
    blockedAction: "Starting checks, offering packages, or implying eligibility screening.",
    owner: "Ben plus counsel/provider."
  },
  {
    topic: "Adverse action",
    requiredProof: "Pre-adverse/adverse-action process, notices, waiting period, and dispute handling.",
    blockedAction: "Returning pass/fail labels, rejection language, or clearance claims.",
    owner: "Ben plus counsel/provider."
  },
  {
    topic: "Data retention and deletion",
    requiredProof: "Retention, deletion, access, audit, and storage policy for reports and artifacts.",
    blockedAction: "Storing reports, provider payloads, or sensitive background-check artifacts.",
    owner: "Ben plus counsel/provider."
  },
  {
    topic: "User-facing copy",
    requiredProof: "Reviewed copy that says background checks are not active until the policy gate passes.",
    blockedAction: "Marketing active background checks, trust guarantees, or legal clearance.",
    owner: "Ben plus product/legal review."
  }
];

export const productGateRolloutReadinessItems: ProductGateRolloutReadinessItem[] = [
  {
    title: "Route smoke proof",
    proof: "Local proof exists for /, /pricing, /membership, /dashboard/billing, /dashboard/crucible, and /operator/gate-knockout.",
    rollback: "If a route fails after rollout, revert the deploy and keep affected gate scoped out.",
    stopCondition: "Stop production rollout if any route needed for launch fails to render."
  },
  {
    title: "Gate status summary",
    proof: "Every Stripe/provider/background-check gate is APPROVED, BLOCKED, DEFERRED, or SCOPED_OUT in the decision packet.",
    rollback: "If a supposedly approved upstream gate lacks proof, roll back live exposure and mark it BLOCKED.",
    stopCondition: "Stop if any upstream gate has ambiguous status."
  },
  {
    title: "Secret exposure check",
    proof: "Decision packet confirms names only and no secret values in chat, files, logs, receipts, or commits.",
    rollback: "If a secret was exposed, rotate it before any rollout continues.",
    stopCondition: "Stop immediately on any suspected secret exposure."
  },
  {
    title: "Payment/provider scope",
    proof: "Live payment routes are approved or disabled; provider/background-check features are approved or visibly inactive.",
    rollback: "Disable or hide any route that implies active money/provider/compliance behavior without proof.",
    stopCondition: "Stop if product copy implies active checks or live payment readiness without approval."
  },
  {
    title: "Production approval phrase",
    proof: "Ben gives APPROVE PRODUCTION ROLLOUT after reviewing proof and rollback notes.",
    rollback: "Use the recorded rollback note and previous deploy reference.",
    stopCondition: "Stop any deploy, push, merge, SQL, production mutation, or public launch without the exact phrase."
  }
];

export const productHumanGates: ProductHumanGate[] = [
  {
    key: "stripe-test-webhook",
    title: "Stripe test checkout + webhook",
    status: "completed",
    area: "stripe",
    gatePhrase: "APPROVE PAID CHECKOUT GO-LIVE (test mode)",
    visibleProof: "Tier-A env 8/8 on Preview and Production; checkout routes unpaused in test mode.",
    blockedUntil: "Ben reviews test-mode checkout and confirms webhook-backed membership state.",
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
    status: "completed",
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
    status: "completed",
    area: "production",
    gatePhrase: "APPROVE PRODUCTION ROLLOUT",
    visibleProof: "Tier-A env redeploy completed 2026-07-05 on werkles.com. Live Stripe keys and lane merges stay gated.",
    blockedUntil: "Completed for tier-A env rollout. Live checkout and push/merge remain separate gates.",
    operatorAction: "Do not redeploy or mutate production without a new explicit rollout phrase."
  }
];

export const productGateKnockoutSteps: ProductGateKnockoutStep[] = [
  {
    order: 1,
    key: "stripe-test-checkout-webhook",
    title: "Stripe test checkout + webhook review",
    gatePhrase: "APPROVE PAID CHECKOUT GO-LIVE (test mode)",
    status: "completed",
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
    status: "completed",
    operatorUrl: "https://dashboard.stripe.com/identity/application",
    localRoutes: ["/dashboard/crucible", "/dashboard/profile"],
    benAction: "Complete Stripe Identity test session and Plaid Link sandbox when credentials are configured.",
    agentPrep: [
      "Crucible sandbox unlocked; identity POST redirects to Stripe when Identity is enabled.",
      "Funds POST requests the configured Plaid Link sandbox experience and fails closed when credentials or configuration are unavailable.",
      "Add Stripe webhook events: identity.verification_session.*"
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
    status: "completed",
    operatorUrl: "https://vercel.com/dashboard",
    localRoutes: ["/", "/membership", "/dashboard/billing", "/dashboard/crucible"],
    benAction: "Tier-A env rollout approved and redeployed 2026-07-05.",
    agentPrep: [
      "Record receipt path foreman/receipts/WERKLES_COM_PRODUCTION_ROLLOUT_20260705.md.",
      "Keep live Stripe and lane-merge gates visibly separate.",
      "Do not infer approval for live keys or push/merge from this completion."
    ],
    forbiddenActions: [
      "Do not redeploy production without a new explicit rollout phrase.",
      "Do not switch to live Stripe keys from this completion alone.",
      "Do not push or merge lanes without Ben gate."
    ],
    proofRequired: [
      "Tier-A env vars configured on Preview and Production.",
      "Production redeploy completed with approval recorded.",
      "Rollback note exists in rollout readiness receipt."
    ],
    stopCondition: "Stop any new production mutation without explicit approval.",
    notes: "Completed for tier-A env custody. HG-1 and HG-2 approved 2026-07-07."
  },
  {
    order: 8,
    key: "discovery-response-go-live",
    title: "Discovery public response go-live",
    gatePhrase: "APPROVE DISCOVERY RESPONSE GO-LIVE",
    status: "operator_gate",
    operatorUrl: "https://werkles.com/discovery",
    localRoutes: ["/discovery", "/bellows"],
    benAction: "Commit to human-read turnaround on public discovery intakes.",
    agentPrep: [
      "No new provider login required.",
      "Show intake form and operator queue path.",
      "Keep Squibb translation human-read until live deck is approved."
    ],
    forbiddenActions: [
      "Do not promise auto-matching or instant responses.",
      "Do not expose intake PII in receipts."
    ],
    proofRequired: [
      "/discovery intake saves successfully.",
      "Operator SLA documented.",
      "Ben gives exact discovery go-live phrase."
    ],
    stopCondition: "Stop if intake route fails or operator capacity undefined.",
    notes: "Zero-barrier front door — no dues required."
  },
  {
    order: 9,
    key: "crucible-phone-provider",
    title: "Crucible phone provider (Twilio)",
    gatePhrase: "APPROVE CRUCIBLE PHONE PROVIDER SETUP",
    status: "operator_gate",
    operatorUrl: "https://console.twilio.com/",
    localRoutes: ["/dashboard/crucible"],
    benAction: "Approve Twilio Verify setup and private credential entry.",
    agentPrep: ["Collect Twilio login.", "Document TWILIO_* env var names only."],
    forbiddenActions: ["Do not send SMS.", "Do not create Verify service without phrase."],
    proofRequired: ["Twilio login works.", "Env var names listed in secret-entry matrix."],
    stopCondition: "Stop at SMS send, billing activation, or secret paste into chat.",
    notes: "Tier 3 extended Crucible — not wired yet."
  },
  {
    order: 10,
    key: "crucible-reference-provider",
    title: "Crucible reference & employment (Checkr)",
    gatePhrase: "APPROVE CRUCIBLE REFERENCE PROVIDER SETUP",
    status: "operator_gate",
    operatorUrl: "https://dashboard.checkr.com/",
    localRoutes: ["/dashboard/crucible", "/pricing"],
    benAction: "Approve Checkr for reference/employment prep only.",
    agentPrep: ["Collect Checkr login.", "Keep separate from FCRA background tier."],
    forbiddenActions: ["Do not order background reports.", "Do not collect FCRA consent."],
    proofRequired: ["Checkr employer account access.", "Package scope documented."],
    stopCondition: "Stop at candidate create, consent, or report order.",
    notes: "Reference/employment only — not background-complete tier."
  },
  {
    order: 11,
    key: "crucible-license-provider",
    title: "Crucible license lookup vendor",
    gatePhrase: "APPROVE CRUCIBLE LICENSE PROVIDER SETUP",
    status: "operator_gate",
    operatorUrl: "https://werkles.com/pricing",
    localRoutes: ["/dashboard/crucible"],
    benAction: "Pick state/county license vendor and approve API scope.",
    agentPrep: ["Document hospitality license types by state.", "No vendor selected yet."],
    forbiddenActions: ["Do not launch paid license check without vendor API proof."],
    proofRequired: ["Vendor selected.", "API credentials stored in 1Password privately."],
    stopCondition: "Stop at per-state paid check launch.",
    notes: "$14.99/state in pricing — API TBD."
  },
  {
    order: 12,
    key: "github-push-merge",
    title: "GitHub push / merge / PR",
    gatePhrase: null,
    status: "operator_gate",
    operatorUrl: "https://github.com/benleakwerkles/Werkles",
    localRoutes: [],
    benAction: "Approve branch push, PR merge, or main integration when canonical guard clears.",
    agentPrep: ["Collect GitHub web + gh CLI sessions on Betsy."],
    forbiddenActions: ["No force push to main.", "No --no-verify without Ben."],
    proofRequired: ["gh auth status PASS.", "Canonical guard blockers resolved or Ben waives."],
    stopCondition: "Stop at main merge or force push.",
    notes: "Separate from product money gates."
  }
];

export function productHumanGatesFor(area: ProductHumanGate["area"]) {
  return productHumanGates.filter((gate) => gate.area === area);
}

export function productGateStatusLabel(status: ProductHumanGateStatus) {
  if (status === "ready_for_review") return "Ready for Ben review";
  if (status === "completed") return "Completed";
  if (status === "operator_gate") return "Human Gate";
  return "Blocked";
}
