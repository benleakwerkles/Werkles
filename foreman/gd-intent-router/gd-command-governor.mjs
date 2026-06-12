/**
 * GD Intent Governor — deterministic keyword classification (shared source).
 * Used by GimpDash (Foreman :4317). No external AI. No persistence.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cousinAssignment = JSON.parse(
  fs.readFileSync(path.join(__dirname, "cousin-assignment.json"), "utf8")
);
const missionRegistry = JSON.parse(
  fs.readFileSync(path.join(__dirname, "mission-classes.json"), "utf8")
);

const COUSIN_META = cousinAssignment.cousins;

const COUSIN_LABELS = {
  PETRA: "Petra (Comptroller / ChatGPT)",
  SKYBRO: "Skybro (Infra / Gemini)",
  ENDER: "Ender (Product / UX / Claude)",
  BEAN: "Bean (Hostile audit / DeepSeek)",
  COMPUTER: "Computer (Doctrine / Perplexity)",
  MAKER: "Maker (Cursor / local implementation)",
  GD: "GD (Cockpit direct — no cousin routing)",
  OPERATOR: "Ben (Operator — human gate)"
};

const HG_NOTES = {
  HG_NONE: "Discovery / draft only — no gate record required",
  HG_RECORD: "Record verdict in APPROVAL_LOG when synthesis lands",
  HG_OPERATOR: "Operator must approve before implementation",
  HG_BLOCKING: "Synthesis cannot recommend PROCEED without explicit gate clearance"
};

const HARD_STOP_RULES = [
  { id: "deploy", pattern: /\b(deploy|production deploy|production rollout|ship to prod)\b/i, stop: "No production deploy" },
  { id: "push-main", pattern: /\b(push to main|merge to main|force push)\b/i, stop: "No push to main" },
  { id: "sql", pattern: /\b(sql|schema change|alter table|migration|supabase schema)\b/i, stop: "No SQL / schema changes" },
  { id: "secrets", pattern: /\b(secrets?|api key|service role|\.env|credential)\b/i, stop: "No secrets handling in chat/repo" },
  { id: "stripe-live", pattern: /\b(stripe live|live stripe|production stripe)\b/i, stop: "No Stripe live" },
  { id: "auth-edit", pattern: /\b(auth edit|change auth|modify auth flow)\b/i, stop: "No auth edits without gate" },
  {
    id: "provider-spend",
    pattern: /\b(provider spend|ghost forge go|run batch|replicate spend|approve spend)\b/i,
    stop: "No provider spend without Ben gate"
  }
];

const HARD_STOP_NEGATIONS = {
  deploy: [
    /\b(no|not|without|never|don't|do not|stop before)\s+deploy\b/i,
    /\bdeploy\b[^.]{0,40}\b(not|no|without|never)\b/i,
    /\b(discovery|draft|preview|local)\s+only\b/i,
    /\bnot\s+(a\s+)?deploy\b/i
  ],
  "push-main": [/\b(no|not|without|never|don't|do not)\s+(push|merge)\b/i],
  sql: [/\b(no|not|without)\s+(sql|schema|migration)\b/i],
  secrets: [/\b(no|not|without)\s+secrets?\b/i],
  "stripe-live": [/\b(no|not|without)\s+stripe\b/i],
  "auth-edit": [/\b(no|not|without)\s+auth\b/i],
  "provider-spend": [/\b(no|not|without)\s+(spend|batch|forge)\b/i, /\bgate\s+05\b/i]
};

const CODE_WORDS = /\b(maker|cursor|codex|implement|wire|typecheck|refactor|code|patch|fix bug|build|npm run)\b/i;
const COPY_WORDS = /\b(copy|headline|voice|narrative|style|wording|lede|subhead)\b/i;
const HOMEPAGE_WORDS = /\b(homepage|home page|landing|hero|lane card|visual)\b/i;

const CLASS_RULES = [
  { id: "thread-refresh", test: (t) => /\b(thread refresh|fresh (ai )?thread|handoff packet)\b/i.test(t), missionClass: "THREAD_REFRESH_PACKET", risk: "LOW" },
  {
    id: "finance",
    test: (t) => /\b(finance|rent roll|mortgage|qbo|quickbooks|capital allocation|runway|plaid|mercury)\b/i.test(t),
    missionClass: "CAPITAL_ALLOCATION",
    risk: "HIGH"
  },
  {
    id: "ghost-forge",
    test: (t) => /\b(ghost forge|render batch|replicate|ideogram|asset render|generate image)\b/i.test(t),
    missionClass: "HOMEPAGE_VISUAL_NARRATIVE",
    risk: "HIGH"
  },
  {
    id: "trust-audit",
    test: (t) => /\b(trust audit|compliance audit|hostile audit|bean audit|crucible audit)\b/i.test(t),
    missionClass: "TRUST_COMPLIANCE_AUDIT",
    risk: "MEDIUM"
  },
  {
    id: "infra",
    test: (t) => /\b(infra ops|provider login|render worker|supabase url|vercel env)\b/i.test(t),
    missionClass: "INFRA_OPS_PREP",
    risk: "MEDIUM"
  },
  {
    id: "dossier",
    test: (t) => /\b(sherlock|entrepreneurship dossier|dossier for sherlock)\b/i.test(t),
    missionClass: "BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK",
    risk: "LOW"
  },
  {
    id: "comptroller",
    test: (t) => /\b(comptroller verdict|petra verdict|go\/no-go)\b/i.test(t),
    missionClass: "COMPTROLLER_VERDICT",
    risk: "HIGH"
  },
  {
    id: "doctrine",
    test: (t) => /\b(doctrine synthesis|open questions|product thesis research)\b/i.test(t),
    missionClass: "DOCTRINE_SYNTHESIS",
    risk: "LOW"
  },
  {
    id: "maker-code",
    test: (t) => CODE_WORDS.test(t) && (HOMEPAGE_WORDS.test(t) || COPY_WORDS.test(t)),
    missionClass: "MAKER_IMPLEMENTATION",
    risk: "MEDIUM"
  },
  {
    id: "homepage-copy",
    test: (t) => (HOMEPAGE_WORDS.test(t) || COPY_WORDS.test(t)) && /\b(narrative|style|homepage|hero)\b/i.test(t),
    missionClass: "PRODUCT_COPY_PASS",
    risk: "MEDIUM"
  },
  {
    id: "homepage-visual",
    test: (t) => HOMEPAGE_WORDS.test(t) || /\bnarrative\b/i.test(t),
    missionClass: "HOMEPAGE_VISUAL_NARRATIVE",
    risk: "MEDIUM"
  },
  {
    id: "ux",
    test: (t) => /\b(ux review|ux pass|design system|iron palette)\b/i.test(t),
    missionClass: "UX_REVIEW",
    risk: "LOW"
  },
  { id: "maker-only", test: (t) => CODE_WORDS.test(t), missionClass: "MAKER_IMPLEMENTATION", risk: "MEDIUM" }
];

const MAKER_MISSION = {
  label: "Maker implementation (local)",
  description: "Local code change in Cursor — typecheck and review, no deploy.",
  recipients: ["MAKER"],
  synthesisLead: "MAKER",
  hgApprovalLevel: "HG_RECORD",
  dispatchClass: "LOCAL_ONLY"
};

const UNCLASSIFIED_MISSION = {
  label: "Unclassified — governor needs clearer intent",
  description: "Intent did not match a known mission class.",
  recipients: ["OPERATOR"],
  synthesisLead: null,
  hgApprovalLevel: "HG_OPERATOR",
  dispatchClass: "NONE"
};

function resolveMission(missionClass) {
  if (missionClass === "MAKER_IMPLEMENTATION") return { key: missionClass, def: MAKER_MISSION };
  if (missionClass === "UNCLASSIFIED") return { key: missionClass, def: UNCLASSIFIED_MISSION };

  const registry = missionRegistry.missionClasses;
  const def = registry[missionClass];
  if (!def) return { key: "UNCLASSIFIED", def: UNCLASSIFIED_MISSION };

  const assignments = cousinAssignment.assignments;
  const recipients = assignments[missionClass] ?? def.recipients ?? [];

  return {
    key: missionClass,
    def: {
      label: def.label,
      description: def.description,
      recipients,
      synthesisLead: def.synthesisLead ?? null,
      hgApprovalLevel: def.hgApprovalLevel,
      dispatchClass: def.dispatchClass,
      cousinLenses: def.cousinLenses
    }
  };
}

function shouldApplyHardStop(text, rule) {
  if (!rule.pattern.test(text)) return false;
  const negations = HARD_STOP_NEGATIONS[rule.id];
  if (negations?.some((p) => p.test(text))) return false;
  return true;
}

function detectHardStops(text) {
  const matched = [];
  const rules = [];
  for (const rule of HARD_STOP_RULES) {
    if (shouldApplyHardStop(text, rule)) {
      matched.push(rule.stop);
      rules.push(rule.id);
    }
  }
  return { hardStops: matched, rules };
}

function buildRoutedCrew(recipientIds, cousinLenses) {
  return recipientIds.map((id) => {
    const meta = COUSIN_META[id];
    if (!meta) {
      return {
        id,
        label: COUSIN_LABELS[id]?.split(" (")[0] ?? id,
        platform: id === "MAKER" ? "Cursor" : id === "GD" ? "Cockpit" : "—",
        seat: id === "MAKER" ? "Local implementation" : id === "OPERATOR" ? "Human gate" : "—",
        lens: cousinLenses?.[id]
      };
    }
    return {
      id,
      label: meta.label,
      platform: meta.platform,
      seat: meta.seat,
      lens: cousinLenses?.[id]
    };
  });
}

function formatRecipients(keys) {
  return keys.map((k) => COUSIN_LABELS[k] ?? k).join(" · ");
}

function riskFromHg(level, fallback) {
  if (level === "HG_BLOCKING") return "HIGH";
  if (level === "HG_OPERATOR") return "MEDIUM";
  return fallback;
}

function buildPacket(intent, missionClass, missionLabel, routedCrew, runId) {
  const excerpt = intent.trim().slice(0, 1200);

  const crewBlock = routedCrew.length
    ? routedCrew
        .map((c) => {
          const lens = c.lens ? `\n  Lens: ${c.lens}` : "";
          return `- **${c.label}** (${c.seat} · ${c.platform})${lens}`;
        })
        .join("\n")
    : "- _Cockpit direct — no cousin packets_";

  return `# GD GOVERNOR DRAFT (preview — reference only)

**Run:** \`${runId}\`
**Mission class:** \`${missionClass}\` — ${missionLabel}
**Mode:** Governor routing preview. No auto-send. No disk writes in console V0.

---

## Operator intent

${excerpt}${intent.length > 1200 ? "\n\n…" : ""}

---

## Auto-routed crew (by role — not operator-selected)

${crewBlock}

---

## Stops (always)

- No production deploy
- No push to main
- No SQL / schema changes
- No secrets in chat
- No Stripe live
- No provider spend without Gate 05 / Operator GO
`;
}

function buildNextAction(verdict, missionClass, routedCrew) {
  if (verdict === "NO_GO") {
    return "STOP — resolve hard stops with Operator before any routing. Draft packet is reference only.";
  }
  if (missionClass === "UNCLASSIFIED") {
    return 'Governor could not classify intent. Rephrase as a plain outcome (e.g. "review homepage narrative", "thread refresh for new session").';
  }
  if (missionClass === "THREAD_REFRESH_PACKET") {
    return "Governor routes cockpit-direct. Click Generate Thread Refresh below when ready.";
  }
  if (missionClass === "MAKER_IMPLEMENTATION") {
    return "Governor routes to Maker (Cursor). Local implementation only — typecheck before handoff.";
  }
  const names = routedCrew.map((c) => c.label).join(", ");
  return `Governor would generate cousin packets for: ${names}. Operator reviews synthesis — no manual crew picking. CLI: npm run gd:generate ${missionClass}`;
}

export function classifyGdCommand(input) {
  const text = input.trim();
  const matchedRules = [];
  const runId = `GD_PREVIEW_${Date.now()}`;

  if (!text) {
    return {
      verdict: "HUMAN_REVIEW_REQUIRED",
      missionClass: "UNCLASSIFIED",
      missionLabel: UNCLASSIFIED_MISSION.label,
      missionDescription: UNCLASSIFIED_MISSION.description,
      routedCrew: [],
      recipient: formatRecipients(["OPERATOR"]),
      recipients: ["OPERATOR"],
      synthesisLead: null,
      dispatchClass: "NONE",
      risk: "BLOCKED",
      humanGate: true,
      humanGateLevel: "HG_OPERATOR",
      humanGateNote: HG_NOTES.HG_OPERATOR,
      hardStops: ["Empty intent"],
      generatedPacket: "",
      nextAction: "State what you want to do in plain language.",
      matchedRules: ["empty"]
    };
  }

  const { hardStops, rules: hardStopRules } = detectHardStops(text);
  matchedRules.push(...hardStopRules);

  let missionClass = "UNCLASSIFIED";
  let ruleRisk = "MEDIUM";

  for (const rule of CLASS_RULES) {
    if (rule.test(text)) {
      missionClass = rule.missionClass;
      ruleRisk = rule.risk;
      matchedRules.push(rule.id);
      break;
    }
  }

  if (missionClass === "UNCLASSIFIED") {
    matchedRules.push("fallback-unclassified");
  }

  const { def } = resolveMission(missionClass);
  const humanGateLevel = def.hgApprovalLevel ?? "HG_OPERATOR";
  const humanGateNote = HG_NOTES[humanGateLevel] ?? humanGateLevel;
  const recipients = [...(def.recipients ?? [])];
  const routedCrew = buildRoutedCrew(recipients, def.cousinLenses);

  const humanGateFromClass = humanGateLevel !== "HG_NONE";
  const humanGateFromHardStop = hardStops.length > 0;
  const humanGate = humanGateFromClass || humanGateFromHardStop || missionClass === "UNCLASSIFIED";

  let verdict = "DRAFT_PACKET_ONLY";
  let risk = riskFromHg(humanGateLevel, ruleRisk);

  if (humanGateFromHardStop) {
    verdict = "NO_GO";
    risk = "BLOCKED";
  } else if (missionClass === "UNCLASSIFIED" || humanGateLevel === "HG_BLOCKING") {
    verdict = "HUMAN_REVIEW_REQUIRED";
    if (missionClass === "UNCLASSIFIED") risk = "HIGH";
  }

  const generatedPacket = buildPacket(text, missionClass, def.label, routedCrew, runId);
  const nextAction = buildNextAction(verdict, missionClass, routedCrew);

  return {
    verdict,
    missionClass,
    missionLabel: def.label,
    missionDescription: def.description,
    routedCrew,
    recipient: formatRecipients(recipients),
    recipients,
    synthesisLead: def.synthesisLead,
    dispatchClass: def.dispatchClass,
    risk: hardStops.length > 0 ? "BLOCKED" : risk,
    humanGate,
    humanGateLevel: hardStops.length > 0 ? "HG_BLOCKING" : humanGateLevel,
    humanGateNote: hardStops.length > 0 ? HG_NOTES.HG_BLOCKING : humanGateNote,
    hardStops: hardStops.length > 0 ? hardStops : ["None detected — still draft-only in preview"],
    generatedPacket,
    nextAction,
    matchedRules
  };
}

export function formatGdCommandVerdict(result) {
  const crewLines = result.routedCrew.map((c) => `${c.label} (${c.seat})`).join(", ");
  return [
    `VERDICT: ${result.verdict}`,
    `TOPIC: ${result.missionLabel} (${result.missionClass})`,
    `ROUTED_CREW: ${crewLines || "—"}`,
    `SYNTHESIS_LEAD: ${result.synthesisLead ?? "—"}`,
    `RISK: ${result.risk}`,
    `HUMAN_GATE: ${result.humanGate ? "YES" : "NO"} (${result.humanGateLevel})`,
    `HARD_STOPS: ${result.hardStops.join(" | ")}`,
    "",
    "GENERATED_PACKET:",
    result.generatedPacket,
    "",
    `NEXT_ACTION: ${result.nextAction}`
  ].join("\n");
}
