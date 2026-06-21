import fs from "node:fs";
import path from "node:path";

import type { CousinId } from "./types";
import type { ProposedBuild, ProposalRisk, ProposalSource } from "./v1-types";

const ROOT = process.cwd();
const PROPOSAL_DOC = path.join(ROOT, "foreman", "soledash", "PROPOSAL_ENGINE_v1.md");

const COUSIN_MAP: Record<string, CousinId> = {
  MAKER: "MAKER",
  DINK: "DINK",
  PETRA: "PETRA",
  ENDER: "ENDER",
  SKYBRO: "SKYBRO",
  BEAN: "BEAN",
  COMPUTER: "COMPUTER"
};

function slugId(title: string): string {
  return `prop_v1_${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40)}`;
}

function buildProposal(input: {
  title: string;
  summary: string;
  whyNow: string;
  expectedImpact: string;
  timeToComplete: string;
  risk: ProposalRisk;
  owner: string;
  machine: string;
  cousin: CousinId;
  missionText: string;
  moreInfo: string;
  sourceType?: ProposalSource;
}): ProposedBuild {
  const now = new Date().toISOString();
  return {
    id: slugId(input.title),
    title: input.title,
    question: `Approve: ${input.title}?`,
    summary: input.summary,
    whyNow: input.whyNow,
    expectedImpact: input.expectedImpact,
    timeToComplete: input.timeToComplete,
    owner: input.owner,
    risk: input.risk,
    sourceType: input.sourceType ?? "roadmap",
    moreInfo: input.moreInfo,
    missionText: input.missionText,
    cousin: input.cousin,
    machine: input.machine,
    missionClass: null,
    missionLabel: null,
    source: "cockpit",
    status: "proposed",
    outboxPath: null,
    outboxFilename: null,
    blocker: null,
    updatedAt: now
  };
}

/** Hardcoded v1 seeds — mirror foreman/soledash/PROPOSAL_ENGINE_v1.md */
export const PROPOSAL_SEEDS_V1: ProposedBuild[] = [
  buildProposal({
    title: "Response Capture Automation",
    summary: "Stop pasting cousin replies — machine ingests responses and validates receipts for you.",
    whyNow: "Every cousin reply still costs you a copy/paste cycle. Mule Elimination lane 1 is incomplete.",
    expectedImpact: "You never manually move a cousin reply again; inbox stays current without mule work.",
    timeToComplete: "2–3 days",
    risk: "low",
    owner: "Maker (Cursor)",
    machine: "Betsy (primary forge)",
    cousin: "MAKER",
    sourceType: "mule_elimination",
    missionText:
      "Automate SoleDash response capture — ingest cousin replies into foreman/handoffs/inbox/ with source metadata and receipt validation. No secrets.",
    moreInfo:
      "Owner: Maker @ Betsy · Cousin: MAKER · Source: Mule Elimination Map lane 1 · Outbox/inbox paths apply on YEA."
  }),
  buildProposal({
    title: "Machine State Capsules",
    summary: "Every handoff carries branch, commit, and runtime — cousins stop guessing local state.",
    whyNow: "Cloud cousins still ask what's on disk. Every packet needs machine context attached automatically.",
    expectedImpact: "Zero “what branch are you on?” loops; handoffs land with full context.",
    timeToComplete: "1 day",
    risk: "low",
    owner: "Dink (local hands)",
    machine: "Betsy — LOCAL HANDS READBACK",
    cousin: "DINK",
    sourceType: "mule_elimination",
    missionText:
      "Harden Machine State Capsule on every SoleDash dispatch. Save snapshots to foreman/soledash/capsules/ on demand.",
    moreInfo:
      "Owner: Dink @ Betsy · Cousin: DINK · Capsules: foreman/soledash/capsules/ · LOCAL HANDS READBACK required."
  }),
  buildProposal({
    title: "Doss Sleep / MWB Fix",
    summary: "Fix Doss sleep and Modern Standby so overnight dev sessions survive without you babysitting.",
    whyNow: "Doss drops sleep mid-session — you lose dev server and Foreman context and recover by hand.",
    expectedImpact: "Doss wakes reliably; long sessions and overnight builds don't die on the bench.",
    timeToComplete: "Half day",
    risk: "medium",
    owner: "Dink (local hands)",
    machine: "Doss",
    cousin: "DINK",
    sourceType: "blocked_work",
    missionText:
      "Diagnose and fix Doss sleep/MWB — powercfg readback, document fix in foreman/MACHINE_TOPOLOGY.md. LOCAL HANDS READBACK on Doss.",
    moreInfo: "Owner: Dink @ Doss · MWB = Modern Standby · powercfg readback · MACHINE_TOPOLOGY.md update on fix."
  }),
  buildProposal({
    title: "Google Drive Workstation Standardization",
    summary: "One Drive layout across workstations so finance docs and entity ledgers aren't hunted by folder.",
    whyNow: "Finance cockpit and entity docs are ad hoc per machine — sync and handoffs waste your time.",
    expectedImpact: "One standard layout; Finance Command and entity ledgers find each other without mule hunts.",
    timeToComplete: "1–2 days",
    risk: "medium",
    owner: "Skybro (Gemini)",
    machine: "Operator cloud + Betsy local",
    cousin: "SKYBRO",
    sourceType: "roadmap",
    missionText:
      "Draft Google Drive workstation standard — entity ledger mirrors, Valley Vanguard spend sheet paths. Stops before OAuth until Ben gate.",
    moreInfo:
      "Owner: Skybro · Stops before OAuth/login · See foreman/finance/ and VALLEY_VANGUARD_SPEND_LEDGER.md."
  }),
  buildProposal({
    title: "Kind Sir SUE vs Grading Review",
    summary: "Comptroller verdict on SUE vs grading scope before field ops commit to the wrong vendor class.",
    whyNow: "Kind Sir construction needs a scope split decision — wrong class means rework and liability.",
    expectedImpact: "Clear GO/NO-GO on SUE vs grading; avoids expensive rework and wrong vendor spend.",
    timeToComplete: "1 day",
    risk: "high",
    owner: "Petra (Comptroller)",
    machine: "ChatGPT — cloud",
    cousin: "PETRA",
    sourceType: "human_gate",
    missionText:
      "Petra review: Kind Sir SUE vs grading scope — verdict, top risks, stop lines. No field commit without Operator approval.",
    moreInfo:
      "Owner: Petra @ ChatGPT · TRUE HUMAN GATE on field commit · Kind Sir entities in foreman/finance/entities.json."
  }),
  buildProposal({
    title: "KindSir.com Refresh Audit",
    summary: "Audit KindSir.com before refresh spend — PASS, PATCH, or NO-GO with cited trust patterns.",
    whyNow: "Site may not match current Kind Sir posture — spending on refresh before audit is waste.",
    expectedImpact: "Know whether to refresh, patch, or stop; no deploy without your gate.",
    timeToComplete: "1 day",
    risk: "medium",
    owner: "Ender (Claude)",
    machine: "Claude — cloud",
    cousin: "ENDER",
    sourceType: "roadmap",
    missionText:
      "UX/trust audit of KindSir.com refresh — top 3 fixes, cringe filters. Display-only; no production deploy.",
    moreInfo: "Owner: Ender @ Claude · Display-only audit · Separate from Werkles homepage."
  })
];

function parseProposalDoc(content: string): ProposedBuild[] | null {
  const blocks = content.split(/^## Proposal:\s*/m).slice(1);
  if (blocks.length === 0) return null;

  const parsed: ProposedBuild[] = [];

  for (const block of blocks) {
    const title = block.split("\n")[0]?.trim();
    if (!title) continue;

    const field = (name: string) =>
      block.match(new RegExp(`-\\s\\*\\*${name}:\\*\\*\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";

    const mission = block.match(/### Mission\s*\n\s*([\s\S]*?)(?=\n---|\n##|$)/)?.[1]?.trim() ?? "";
    const cousinRaw = field("Cousin").toUpperCase();
    const cousin = COUSIN_MAP[cousinRaw] ?? "MAKER";
    const riskRaw = field("Risk").toLowerCase();
    const risk: ProposalRisk =
      riskRaw === "high" ? "high" : riskRaw === "medium" ? "medium" : "low";
    const whyNow = field("Why now");
    const summary = field("Summary") || field("What") || whyNow;

    if (!whyNow) continue;

    parsed.push(
      buildProposal({
        title,
        summary,
        whyNow,
        expectedImpact: field("Expected impact") || field("Impact"),
        timeToComplete: field("Time to complete") || "TBD",
        risk,
        owner: field("Owner"),
        machine: field("Machine"),
        cousin,
        missionText: mission || title,
        moreInfo: `Owner: ${field("Owner")} @ ${field("Machine")} · Cousin: ${cousinRaw || cousin}. Loaded from PROPOSAL_ENGINE_v1.md.`,
        sourceType: "roadmap"
      })
    );
  }

  return parsed.length >= 1 ? parsed : null;
}

export function loadProposalCatalogV1(): ProposedBuild[] {
  try {
    const content = fs.readFileSync(PROPOSAL_DOC, "utf8");
    const fromDoc = parseProposalDoc(content);
    if (fromDoc && fromDoc.length >= 6) return fromDoc;
  } catch {
    /* use seeds */
  }
  return PROPOSAL_SEEDS_V1.map((p) => ({ ...p, timeToComplete: p.timeToComplete ?? "TBD" }));
}

export function findProposalById(id: string): ProposedBuild | undefined {
  return loadProposalCatalogV1().find((p) => p.id === id);
}
