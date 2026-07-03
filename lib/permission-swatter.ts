export type PermissionPrompt = {
  prompt_id?: string;
  source?: string;
  requested_action?: string;
  command?: string;
  justification?: string;
  sandbox_permissions?: string;
  prefix_rule?: string[];
  files?: string[];
  url?: string;
  context?: string;
  prompt_text?: string;
};

export type PermissionVerdict = "SWAT" | "HUMAN_GATE" | "WATCH" | "STOP";
export type PermissionDisposition = "SWAT_AWAY" | "ESCALATE_TO_BEN" | "HOLD_FOR_REVIEW" | "BLOCK";

type GateRule = {
  id: string;
  rule: string;
  terms: string[];
};

type NonGateRule = GateRule & {
  commandPatterns?: RegExp[];
};

export type PermissionSwatterReceipt = {
  artifact_id: "permission-swatter-v0";
  verdict: PermissionVerdict;
  disposition: PermissionDisposition;
  auto_approval_allowed: boolean;
  human_gate: boolean;
  confidence: number;
  rule_id: string;
  rule: string;
  reason: string;
  matched_terms: string[];
  source_authority: string[];
  prompt: PermissionPrompt;
  timestamp: string;
};

const SOURCE_AUTHORITY = [
  "foreman/HUMAN_GATES.md",
  "foreman/LANES.md",
  "foreman/BUDGET.md",
  "foreman/platform-instructions/CODEX_FOREMAN_INSTRUCTIONS.md",
];

const HUMAN_GATE_RULES: GateRule[] = [
  {
    id: "HG_AUTH_SECRET_CREDENTIAL",
    rule: "credentials, secrets, private keys, auth, OAuth, login, or account settings require Ben",
    terms: [
      "secret",
      "credential",
      "password",
      "token",
      "api key",
      "private key",
      "oauth",
      "login",
      "sign in",
      "account setting",
      "save password",
    ],
  },
  {
    id: "HG_MONEY_BILLING_SPEND",
    rule: "billing, payment, credit cards, paid provider activation, or spend require Ben",
    terms: [
      "billing",
      "payment",
      "credit card",
      "checkout",
      "stripe",
      "paid",
      "purchase",
      "subscribe",
      "subscription",
      "spend",
      "invoice",
    ],
  },
  {
    id: "HG_PUBLIC_DEPLOY_RELEASE",
    rule: "push, merge, deploy, publish, release, or public launch require Ben",
    terms: [
      "git push",
      "push to remote",
      "push to origin",
      "merge to main",
      "merge main",
      "main branch",
      "deploy",
      "publish",
      "release",
      "public launch",
      "production deploy",
    ],
  },
  {
    id: "HG_PRODUCTION_DATA_SCHEMA",
    rule: "production data mutation, SQL, schema, RLS, or policy changes require Ben",
    terms: [
      "production data",
      "prod data",
      "insert into",
      "update production",
      "update prod",
      "production update",
      "prod update",
      "delete from",
      "sql",
      "schema",
      "migration",
      "rls",
      "row level security",
      "policy",
      "supabase",
    ],
  },
  {
    id: "HG_LEGAL_CREATIVE_APPROVAL",
    rule: "legal, compliance, counsel, or final creative direction approval require Ben",
    terms: ["legal", "compliance", "counsel", "attorney", "final approval", "creative direction", "approve final"],
  },
  {
    id: "HG_EXTERNAL_TRANSMISSION",
    rule: "messages, uploads, sharing, forms, comments, and external side effects require Ben when they transmit data",
    terms: ["send email", "send message", "forward", "submit", "share", "upload", "post", "comment", "invite", "transfer ownership"],
  },
  {
    id: "HG_REMOTE_ACCESS_SECURITY",
    rule: "remote access pairings, router/firewall changes, unattended access, and access credentials require Ben",
    terms: ["unattended", "pair moonlight", "pairing", "router", "firewall", "port forward", "remote access", "access credential"],
  },
  {
    id: "HG_DESTRUCTIVE_IRREVERSIBLE",
    rule: "destructive or irreversible filesystem, process, or repo actions require Ben unless explicitly allowlisted",
    terms: [
      "rm -rf",
      "remove-item -recurse",
      "remove-item",
      "delete",
      "rmdir",
      "del ",
      "format",
      "git reset --hard",
      "git clean",
      "drop table",
      "taskkill",
      "stop-process",
      "kill process",
      "terminate process",
    ],
  },
];

const NON_GATE_RULES: NonGateRule[] = [
  {
    id: "NG_LOCAL_TYPECHECK",
    rule: "local typecheck is a non-gate technical proof inside the approved lane",
    terms: ["typecheck", "tsc --noemit", "tsc --no emit", "tsc --no-emit"],
    commandPatterns: [/^npm(\.cmd)?\s+run\s+typecheck\b/i, /^npx\s+tsc\s+--noEmit\b/i, /^tsc\s+--noEmit\b/i],
  },
  {
    id: "NG_LOCAL_BUILD",
    rule: "local build is a non-gate technical proof when it does not deploy, publish, or spend",
    terms: ["local build", "next build", "npm run build", "npm.cmd run build"],
    commandPatterns: [/^npm(\.cmd)?\s+run\s+build\b/i, /^next\s+build\b/i],
  },
  {
    id: "NG_LOCAL_DEV_SERVER",
    rule: "local dev server or local route load is a non-gate technical proof",
    terms: ["local dev", "localhost", "127.0.0.1", "health check", "route load"],
    commandPatterns: [
      /^npm(\.cmd)?\s+run\s+dev\b/i,
      /^invoke-webrequest\b.*(localhost|127\.0\.0\.1)/i,
      /^start-process\b.*(localhost|127\.0\.0\.1)/i,
    ],
  },
  {
    id: "NG_LOCAL_READ_INSPECT",
    rule: "local read-only inspection is a non-gate technical proof",
    terms: ["read-only", "inspect", "search", "list files"],
    commandPatterns: [/^rg\b/i, /^get-content\b/i, /^get-childitem\b/i, /^dir\b/i, /^git\s+(status|log|diff)\b/i],
  },
  {
    id: "NG_DRY_RUN_SCAFFOLD",
    rule: "dry runs, scaffold checks, and local verification are non-gates when bounded to the workspace",
    terms: ["dry run", "scaffold", "verification", "smoke test", "local sandbox"],
  },
];

function promptText(prompt: PermissionPrompt) {
  return [
    prompt.prompt_text,
    prompt.source,
    prompt.requested_action,
    prompt.command,
    prompt.justification,
    prompt.sandbox_permissions,
    prompt.prefix_rule?.join(" "),
    prompt.files?.join(" "),
    prompt.url,
    prompt.context,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function normalizeCommand(command?: string) {
  return command?.trim().replace(/\s+/g, " ") || "";
}

function matchingTerms(text: string, terms: string[]) {
  return terms.filter((term) => text.includes(term.toLowerCase()));
}

function nonGateMatch(prompt: PermissionPrompt, text: string) {
  const command = normalizeCommand(prompt.command).toLowerCase();
  for (const rule of NON_GATE_RULES) {
    const termMatches = matchingTerms(text, rule.terms);
    const commandMatches = rule.commandPatterns?.some((pattern) => pattern.test(command)) || false;
    if (termMatches.length || commandMatches) {
      return {
        rule,
        matchedTerms: commandMatches ? [...termMatches, "command_pattern"] : termMatches,
      };
    }
  }

  return null;
}

function humanGateMatch(text: string) {
  for (const rule of HUMAN_GATE_RULES) {
    const matchedTerms = matchingTerms(text, rule.terms);
    if (matchedTerms.length) return { rule, matchedTerms };
  }

  return null;
}

function containsEscalationWithoutContext(prompt: PermissionPrompt, text: string) {
  const asksForEscalation = prompt.sandbox_permissions === "require_escalated" || text.includes("require_escalated");
  const hasContext = Boolean(prompt.command || prompt.requested_action || prompt.prompt_text);
  return asksForEscalation && !hasContext;
}

export function classifyPermissionPrompt(prompt: PermissionPrompt): PermissionSwatterReceipt {
  const text = promptText(prompt);
  const timestamp = new Date().toISOString();

  if (!text.trim() || containsEscalationWithoutContext(prompt, text)) {
    return {
      artifact_id: "permission-swatter-v0",
      verdict: "WATCH",
      disposition: "HOLD_FOR_REVIEW",
      auto_approval_allowed: false,
      human_gate: false,
      confidence: 0.35,
      rule_id: "WATCH_INSUFFICIENT_CONTEXT",
      rule: "unknown or insufficient permission context cannot be swatted",
      reason: "No bounded prompt/action was available for doctrine matching.",
      matched_terms: [],
      source_authority: SOURCE_AUTHORITY,
      prompt,
      timestamp,
    };
  }

  const gate = humanGateMatch(text);
  if (gate) {
    return {
      artifact_id: "permission-swatter-v0",
      verdict: "HUMAN_GATE",
      disposition: "ESCALATE_TO_BEN",
      auto_approval_allowed: false,
      human_gate: true,
      confidence: 0.95,
      rule_id: gate.rule.id,
      rule: gate.rule.rule,
      reason: "Matched a required Human Gate category. Machine must not approve this.",
      matched_terms: gate.matchedTerms,
      source_authority: SOURCE_AUTHORITY,
      prompt,
      timestamp,
    };
  }

  const nonGate = nonGateMatch(prompt, text);
  if (nonGate) {
    return {
      artifact_id: "permission-swatter-v0",
      verdict: "SWAT",
      disposition: "SWAT_AWAY",
      auto_approval_allowed: true,
      human_gate: false,
      confidence: 0.88,
      rule_id: nonGate.rule.id,
      rule: nonGate.rule.rule,
      reason: "Matched a non-gate technical proof inside the approved local build lane.",
      matched_terms: nonGate.matchedTerms,
      source_authority: SOURCE_AUTHORITY,
      prompt,
      timestamp,
    };
  }

  return {
    artifact_id: "permission-swatter-v0",
    verdict: "WATCH",
    disposition: "HOLD_FOR_REVIEW",
    auto_approval_allowed: false,
    human_gate: false,
    confidence: 0.52,
    rule_id: "WATCH_UNMATCHED_PERMISSION",
    rule: "unmatched prompts stay visible until doctrine or allowlist covers them",
    reason: "No Human Gate was proven, but no approved non-gate rule matched either.",
    matched_terms: [],
    source_authority: SOURCE_AUTHORITY,
    prompt,
    timestamp,
  };
}

export function permissionSwatterManifest() {
  return {
    artifact_id: "permission-swatter-v0",
    name: "Permission Swatter V0",
    doctrine: {
      auto_swat_only_when: "verdict is SWAT and auto_approval_allowed is true",
      never_auto_approve: "HUMAN_GATE, WATCH, or STOP",
      true_human_gate_disposition: "ESCALATE_TO_BEN",
    },
    human_gate_rules: HUMAN_GATE_RULES.map(({ id, rule }) => ({ id, rule })),
    non_gate_rules: NON_GATE_RULES.map(({ id, rule }) => ({ id, rule })),
  };
}
