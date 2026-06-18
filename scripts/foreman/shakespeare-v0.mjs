#!/usr/bin/env node

const VERDICTS = new Set(["SWAT", "RECEIPT", "STOP", "HUMAN_GATE"]);

const RULES = [
  {
    id: "human_gate_credentials",
    classifier: "HUMAN_GATE_SECURITY",
    policy: "operator_required_sensitive_access",
    verdict: "HUMAN_GATE",
    patterns: [
      /\bcredentials?\b/i,
      /\bpasswords?\b/i,
      /\bpasscode\b/i,
      /\bmfa\b/i,
      /\b2fa\b/i,
      /\bone[-\s]?time code\b/i,
      /\botp\b/i,
      /\bsecrets?\b/i,
      /\bapi key\b/i,
      /\baccess token\b/i,
      /\bprivate key\b/i,
      /(^|[^a-z0-9])\.env([^a-z0-9]|$)/i
    ]
  },
  {
    id: "human_gate_money_accounts",
    classifier: "HUMAN_GATE_MONEY_ACCOUNT",
    policy: "operator_required_money_or_account",
    verdict: "HUMAN_GATE",
    patterns: [
      /\bpayments?\b/i,
      /\bbanking\b/i,
      /\bbank account\b/i,
      /\bwire transfer\b/i,
      /\bbilling\b/i,
      /\bcredit card\b/i,
      /\baccount ownership\b/i,
      /\btransfer account\b/i,
      /\bchange owner\b/i
    ]
  },
  {
    id: "human_gate_public_or_prod",
    classifier: "HUMAN_GATE_PUBLIC_PROD",
    policy: "operator_required_public_or_production",
    verdict: "HUMAN_GATE",
    patterns: [
      /\bdns\b/i,
      /\bnameserver\b/i,
      /\bdomain record\b/i,
      /\bproduction deploy(?:ment)?\b/i,
      /\bdeploy production\b/i,
      /\blive deploy\b/i,
      /\bship to prod\b/i,
      /\bgit\s+(push|merge)\b/i,
      /\bpush\s+to\s+(main|origin|remote)\b/i,
      /\bmerge\s+(main|to|into)\b/i,
      /\bpublic firewall\b/i,
      /\brouter\b/i,
      /\bport forward\b/i,
      /\bpublic exposure\b/i,
      /\bmake public\b/i,
      /\bopen firewall port\b/i
    ]
  },
  {
    id: "stop_destructive_or_unknown_admin",
    classifier: "STOP_DESTRUCTIVE_ADMIN",
    policy: "deny_unknown_or_destructive_local_change",
    verdict: "STOP",
    patterns: [
      /\bdestructive delete\b/i,
      /\brm\s+-rf\b/i,
      /\bremove-item\b.*\b(-recurse|-force)\b/i,
      /\bdelete\b.*\b(recursive|permanent|all)\b/i,
      /\bwipe\b/i,
      /\bformat\b/i,
      /\bunknown admin\b/i,
      /\bunknown security change\b/i,
      /\bsecurity setting\b/i,
      /\bdefender exclusion\b/i,
      /\bregistry change\b/i,
      /\bbios\b/i,
      /\binstall driver\b/i,
      /\bdriver install\b/i
    ]
  },
  {
    id: "receipt_blue_local_execution",
    classifier: "LOCAL_EXECUTE_WITH_RECEIPT",
    policy: "blue_local_action_receipt_required",
    verdict: "RECEIPT",
    patterns: [
      /\breceipt generation\b/i,
      /\bgenerate receipt\b/i,
      /\bwrite receipt\b/i,
      /\breceipt write\b/i,
      /\bpacket generation\b/i,
      /\bgenerate packet\b/i,
      /\bwrite packet\b/i,
      /\bpacket write\b/i,
      /\bmwb local restart recovery\b/i,
      /\bmouse without borders restart\b/i,
      /\brestart mwb\b/i,
      /\blocal restart recovery\b/i
    ]
  },
  {
    id: "swat_green_local_mechanical",
    classifier: "LOCAL_MECHANICAL_SAFE",
    policy: "green_local_silent_swat",
    verdict: "SWAT",
    patterns: [
      /\blocal read\b/i,
      /\bread local\b/i,
      /\bread file\b/i,
      /\bget-content\b/i,
      /\blocal probe\b/i,
      /\blocalhost check\b/i,
      /\blocalhost proof\b/i,
      /\btypecheck\b/i,
      /\btsc --noemit\b/i,
      /\btsc --noEmit\b/i,
      /\bfile search\b/i,
      /\brepo search\b/i,
      /\bripgrep\b/i,
      /\brg\s+/i,
      /\bprocess inventory\b/i,
      /\bservice inventory\b/i,
      /\bnetwork inventory\b/i,
      /\blauncher check\b/i,
      /\bstartup check\b/i,
      /\bping probe\b/i,
      /\brdp probe\b/i,
      /\bssh probe\b/i
    ]
  }
];

function normalizeIntent(input) {
  return String(input ?? "").replace(/\s+/g, " ").trim();
}

function verdictConfidence(verdict, rule) {
  if (rule === "default_stop" || rule === "empty_intent") return "low — unclassified";
  if (verdict === "HUMAN_GATE") return "medium — operator required";
  if (verdict === "STOP") return "high — deny";
  return "high — hardcoded rule match";
}

export function classifyIntent(input) {
  const intent = normalizeIntent(input);

  if (!intent) {
    return {
      intent,
      classifier: "EMPTY_INTENT",
      policy: "deny_empty_intent",
      verdict: "STOP",
      rule: "empty_intent",
      reason: "No intent text supplied.",
      confidence: verdictConfidence("STOP", "empty_intent")
    };
  }

  for (const rule of RULES) {
    const matched = rule.patterns.find((pattern) => pattern.test(intent));
    if (!matched) continue;
    return {
      intent,
      classifier: rule.classifier,
      policy: rule.policy,
      verdict: rule.verdict,
      rule: rule.id,
      reason: `Matched ${rule.id}.`,
      confidence: verdictConfidence(rule.verdict, rule.id)
    };
  }

  return {
    intent,
    classifier: "UNKNOWN_INTENT",
    policy: "deny_unclassified_default_stop",
    verdict: "STOP",
    rule: "default_stop",
    reason: "No hardcoded rule matched.",
    confidence: verdictConfidence("STOP", "default_stop")
  };
}

function renderDecision(decision, rawOnly = false) {
  if (!VERDICTS.has(decision.verdict)) {
    throw new Error(`Invalid verdict: ${decision.verdict}`);
  }

  if (rawOnly) {
    return `${decision.verdict}\n`;
  }

  return `${JSON.stringify(
    {
      schema: "SHAKESPEARE_V0",
      path: "Intent -> Classifier -> Policy -> Verdict",
      intent: decision.intent,
      classifier: decision.classifier,
      policy: decision.policy,
      verdict: decision.verdict,
      rule: decision.rule,
      reason: decision.reason,
      confidence: decision.confidence
    },
    null,
    2
  )}\n`;
}

function selfTest() {
  const cases = [
    ["local read workstation note", "SWAT"],
    ["MWB local restart recovery", "RECEIPT"],
    ["production deploy", "HUMAN_GATE"],
    ["delete all files recursive", "STOP"],
    ["explain the fog machine", "STOP"]
  ];

  const results = cases.map(([intent, expected]) => {
    const decision = classifyIntent(intent);
    return {
      intent,
      expected,
      actual: decision.verdict,
      pass: decision.verdict === expected,
      classifier: decision.classifier,
      policy: decision.policy,
      rule: decision.rule
    };
  });

  const passed = results.every((result) => result.pass);
  return {
    schema: "SHAKESPEARE_V0_SELF_TEST",
    passed,
    results
  };
}

const [cmd = "classify", ...args] = process.argv.slice(2);

try {
  if (cmd === "self-test") {
    const result = selfTest();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.passed) process.exitCode = 1;
  } else if (cmd === "raw") {
    process.stdout.write(renderDecision(classifyIntent(args.join(" ")), true));
  } else if (cmd === "classify") {
    process.stdout.write(renderDecision(classifyIntent(args.join(" "))));
  } else {
    process.stdout.write(renderDecision(classifyIntent([cmd, ...args].join(" "))));
  }
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
}
