import missionClassesJson from "../../../foreman/gd-intent-router/mission-classes.json";
import type { CousinId, MissionClassification, MissionPacket } from "./types";
import { STANDARD_CONSTRAINTS as CONSTRAINTS } from "./types";

type MissionClassDef = {
  label: string;
  description: string;
  recipients?: string[];
  synthesisLead?: string | null;
};

function missionRegistry(): Record<string, MissionClassDef> {
  return missionClassesJson.missionClasses as unknown as Record<string, MissionClassDef>;
}

const MISSION_KEYWORDS: Record<string, string[]> = {
  HOMEPAGE_VISUAL_NARRATIVE: ["homepage", "hero", "visual", "narrative", "spark", "forge", "foundry", "imagery"],
  UX_REVIEW: ["ux review", "ux pass", "ui review", "copy pass", "cringe", "iron palette"],
  CAPITAL_ALLOCATION: ["budget", "capital", "runway", "spend", "allocation", "billing posture"],
  TRUST_COMPLIANCE_AUDIT: ["compliance", "trust audit", "hostile audit", "legal", "privacy", "bean"],
  INFRA_OPS_PREP: ["infra", "provider", "render", "deploy prep", "oauth prep", "dns"],
  COMPTROLLER_VERDICT: ["go/no-go", "comptroller", "petra verdict", "scope verdict", "gate map"],
  DOCTRINE_SYNTHESIS: ["doctrine", "synthesis", "open questions", "thesis"],
  BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK: ["dossier", "sherlock", "entrepreneurship", "commercial pattern"],
  LOCAL_BUILD: ["localhost", "build pages", "typecheck", "dev server", "implement", "wire", "component", "route"],
  SQUIBB_CONCIERGE: ["concierge", "squibb", "intake", "speaker read", "walkthrough", "symptom"],
  SOLEDASH_OPS: ["soledash", "command surface", "mule elimination", "cockpit", "operator"]
};

const COUSIN_MACHINES: Record<CousinId, string> = {
  MAKER: "Betsy (primary forge) / Cursor",
  DINK: "Local machine — LOCAL HANDS READBACK",
  PETRA: "ChatGPT — cloud",
  ENDER: "Claude — cloud",
  SKYBRO: "Gemini — cloud",
  BEAN: "DeepSeek — cloud",
  COMPUTER: "Perplexity — cloud"
};

function scoreMission(text: string): { key: string; score: number; terms: string[] }[] {
  const lower = text.toLowerCase();
  const results: { key: string; score: number; terms: string[] }[] = [];

  for (const [key, terms] of Object.entries(MISSION_KEYWORDS)) {
    const matched = terms.filter((t) => lower.includes(t));
    if (matched.length > 0) {
      results.push({ key, score: matched.length * 10 + (matched.some((m) => m.length > 8) ? 5 : 0), terms: matched });
    }
  }

  const registry = missionRegistry();
  for (const [key, def] of Object.entries(registry)) {
    const labelWords = def.label.toLowerCase().split(/\s+/);
    const descWords = def.description.toLowerCase().split(/\s+/).slice(0, 8);
    const matched = [...labelWords, ...descWords].filter((w) => w.length > 4 && lower.includes(w));
    if (matched.length > 0) {
      const existing = results.find((r) => r.key === key);
      const addScore = matched.length * 4;
      if (existing) existing.score += addScore;
      else results.push({ key, score: addScore, terms: matched.slice(0, 5) });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

function suggestCousins(missionClass: string | null, text: string): MissionClassification["suggestedCousins"] {
  const lower = text.toLowerCase();
  const suggestions: MissionClassification["suggestedCousins"] = [];

  const registry = missionRegistry();
  const def = missionClass ? registry[missionClass] : null;
  const recipients = (def?.recipients ?? []) as CousinId[];

  for (const id of recipients) {
    if (id in COUSIN_MACHINES) {
      suggestions.push({
        id: id as CousinId,
        machine: COUSIN_MACHINES[id as CousinId],
        reason: def ? `Recipient for ${def.label}` : "Mission class recipient"
      });
    }
  }

  if (/implement|build|code|typecheck|localhost|component|route|fix ci/.test(lower)) {
    if (!suggestions.some((s) => s.id === "MAKER")) {
      suggestions.unshift({
        id: "MAKER",
        machine: COUSIN_MACHINES.MAKER,
        reason: "Implementation / localhost build lane"
      });
    }
  }

  if (/local hands|readback|powershell|npm run dev|taskkill|port/.test(lower)) {
    suggestions.push({
      id: "DINK",
      machine: COUSIN_MACHINES.DINK,
      reason: "Local machine operations"
    });
  }

  if (/audit|hostile|exploit|compliance/.test(lower) && !suggestions.some((s) => s.id === "BEAN")) {
    suggestions.push({ id: "BEAN", machine: COUSIN_MACHINES.BEAN, reason: "Hostile audit lens" });
  }

  if (/research|cite|current|pricing|vendor/.test(lower) && !suggestions.some((s) => s.id === "COMPUTER")) {
    suggestions.push({
      id: "COMPUTER",
      machine: COUSIN_MACHINES.COMPUTER,
      reason: "Cited research lane"
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "MAKER",
      machine: COUSIN_MACHINES.MAKER,
      reason: "Default — clarify mission class if unsure"
    });
  }

  return suggestions.slice(0, 4);
}

export function classifyMission(rawMission: string): MissionClassification {
  const trimmed = rawMission.trim();
  if (!trimmed) {
    return {
      missionClass: null,
      label: null,
      confidence: "low",
      matchedTerms: [],
      suggestedCousins: [{ id: "MAKER", machine: COUSIN_MACHINES.MAKER, reason: "Empty mission — paste Ben intent" }],
      constraints: [...CONSTRAINTS]
    };
  }

  const scores = scoreMission(trimmed);
  const top = scores[0];
  const registry = missionRegistry();

  let missionClass: string | null = null;
  let label: string | null = null;
  let confidence: MissionClassification["confidence"] = "low";

  if (top && top.score >= 10) {
    if (top.key in registry) {
      missionClass = top.key;
      label = registry[top.key].label;
      confidence = top.score >= 25 ? "high" : top.score >= 15 ? "medium" : "low";
    } else {
      missionClass = top.key;
      label = top.key.replace(/_/g, " ").toLowerCase();
      confidence = "medium";
    }
  }

  return {
    missionClass,
    label,
    confidence,
    matchedTerms: top?.terms ?? [],
    suggestedCousins: suggestCousins(missionClass, trimmed),
    constraints: [...CONSTRAINTS]
  };
}

export function buildMissionPacket(input: {
  rawMission: string;
  classification: MissionClassification;
  capsuleSnippet: string;
}): MissionPacket {
  const { rawMission, classification, capsuleSnippet } = input;
  const generatedAt = new Date().toISOString();
  const primary = classification.suggestedCousins[0];

  const cousinBlocks = classification.suggestedCousins
    .map(
      (c) =>
        `- **${c.id}** @ ${c.machine} — ${c.reason}`
    )
    .join("\n");

  const packetMarkdown = `# Mission packet (draft — do not auto-send)

**Generated:** ${generatedAt}  
**Mission class:** ${classification.missionClass ?? "UNCLASSIFIED"}${classification.label ? ` (${classification.label})` : ""}  
**Confidence:** ${classification.confidence}  
**Primary cousin:** ${primary?.id ?? "TBD"} @ ${primary?.machine ?? "TBD"}

## Ben mission (raw)

${rawMission.trim()}

## Machine state (snippet)

${capsuleSnippet.trim()}

## Suggested routing

${cousinBlocks}

## Standard constraints

${classification.constraints.map((c) => `- ${c}`).join("\n")}

## Response required from cousin

- RECEIVED line
- GD_RECEIPT line (when GD run exists)
- Answer the mission — no deploy/push/secrets without Operator gate

---
*SoleDash Mission Router v0 — stops before send.*
`;

  return {
    version: "v0",
    packetType: "mission_router_draft",
    generatedAt,
    missionClass: classification.missionClass,
    missionLabel: classification.label,
    rawMission: rawMission.trim(),
    classification,
    capsuleSnippet,
    packetMarkdown,
    stopsBeforeSend: true
  };
}
