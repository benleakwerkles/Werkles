#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_ALIAS_GATE = "TIER_1_HUMAN_GATE";
export const DEFAULT_PRODUCTION_ALIAS_CONFIG = "deploy/production-aliases.json";

const PREVIEW_BLOCK_RULES = [
  {
    id: "WERKLES_CUSTOM_DOMAIN",
    description: "Preview deploys cannot request or apply any werkles.com custom domain.",
    matches(hostname) {
      return hostname === "werkles.com" || hostname.endsWith(".werkles.com");
    }
  },
  {
    id: "VERCEL_PROJECT_PRODUCTION_ALIAS",
    description: "Preview deploys cannot request or apply the Vercel production project aliases.",
    matches(hostname) {
      return hostname === "werkles.vercel.app" || hostname === "werkles-werkles.vercel.app";
    }
  }
];

export function evaluateAliasGuard(input = {}) {
  const deployTarget = normalizeDeployTarget(input.deployTarget ?? process.env.DEPLOY_TARGET ?? process.env.VERCEL_ENV ?? "preview");
  const requestedAliases = uniqueAliases(input.aliases ?? []);
  const appliedAliases = uniqueAliases(input.appliedAliases ?? []);
  const aliasRequested = Boolean(input.aliasRequested) || requestedAliases.length > 0;
  const aliasChangePresent = aliasRequested || appliedAliases.length > 0;
  const humanGate = input.humanGate ?? process.env.HUMAN_GATE ?? "";
  const productionAliasConfig = input.productionAliasConfig ?? DEFAULT_PRODUCTION_ALIAS_CONFIG;
  const repoRoot = input.repoRoot ?? process.cwd();
  const reasons = [];
  const blockedAliases = [];
  let productionAliasConfigLoaded = false;

  if (!["preview", "production"].includes(deployTarget)) {
    reasons.push({
      reason: "UNKNOWN_DEPLOY_TARGET",
      detail: `DEPLOY_TARGET must be preview or production, got ${deployTarget || "blank"}.`
    });
  }

  if (deployTarget === "preview") {
    if (input.productionAliasConfig) {
      reasons.push({
        reason: "PREVIEW_CANNOT_READ_PRODUCTION_ALIAS_CONFIG",
        detail: "Preview pipeline refused a production alias config path before any file read."
      });
    }

    for (const alias of [...requestedAliases, ...appliedAliases]) {
      const rule = PREVIEW_BLOCK_RULES.find((candidate) => candidate.matches(alias));
      if (rule) {
        blockedAliases.push({ alias, rule: rule.id });
      }
    }

    if (blockedAliases.length) {
      reasons.push({
        reason: "BLOCKED_PREVIEW_PRODUCTION_ALIAS",
        detail: blockedAliases.map((entry) => `${entry.alias}:${entry.rule}`).join(", ")
      });
    }
  }

  if (aliasChangePresent && humanGate !== REQUIRED_ALIAS_GATE) {
    reasons.push({
      reason: "ALIAS_CHANGE_REQUIRES_TIER_1_HUMAN_GATE",
      detail: `Set HUMAN_GATE=${REQUIRED_ALIAS_GATE} for any alias change.`
    });
  }

  if (deployTarget === "production" && aliasChangePresent && humanGate === REQUIRED_ALIAS_GATE) {
    const configPath = path.resolve(repoRoot, productionAliasConfig);
    if (!existsSync(configPath)) {
      reasons.push({
        reason: "PRODUCTION_ALIAS_CONFIG_MISSING",
        detail: productionAliasConfig
      });
    } else {
      productionAliasConfigLoaded = true;
      const config = JSON.parse(readFileSync(configPath, "utf8"));
      const allowedAliases = new Set(uniqueAliases(config.aliases ?? []));
      const unknownAliases = [...requestedAliases, ...appliedAliases].filter((alias) => !allowedAliases.has(alias));
      if (unknownAliases.length) {
        reasons.push({
          reason: "ALIAS_NOT_IN_PRODUCTION_CONFIG",
          detail: unknownAliases.join(", ")
        });
      }
      if (config.human_gate_required !== REQUIRED_ALIAS_GATE) {
        reasons.push({
          reason: "PRODUCTION_ALIAS_CONFIG_GATE_MISMATCH",
          detail: `Expected ${REQUIRED_ALIAS_GATE}.`
        });
      }
    }
  }

  const aliasGuardResult = reasons.length ? "STOP" : "PASS";
  const receipt = {
    receipt_id: `DEPLOY_ALIAS_GUARD_${new Date().toISOString().replace(/[-:.TZ]/g, "")}`,
    deploy_target: deployTarget,
    alias_requested: aliasRequested ? requestedAliases : [],
    alias_applied: appliedAliases,
    alias_guard_result: aliasGuardResult,
    human_gate: humanGate || null,
    required_human_gate: aliasChangePresent ? REQUIRED_ALIAS_GATE : null,
    production_alias_config_loaded: productionAliasConfigLoaded,
    blocked_aliases: blockedAliases,
    reasons
  };

  return {
    ok: aliasGuardResult === "PASS",
    receipt
  };
}

export function normalizeAlias(alias) {
  let value = String(alias ?? "").trim();
  if (!value) return "";

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    try {
      value = new URL(value).hostname;
    } catch {
      value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    }
  }

  return value
    .split(/[/?#]/, 1)[0]
    .replace(/\.$/, "")
    .toLowerCase();
}

function uniqueAliases(aliases) {
  const values = Array.isArray(aliases) ? aliases : splitAliases(aliases);
  return [...new Set(values.map(normalizeAlias).filter(Boolean))];
}

function splitAliases(value) {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeDeployTarget(target) {
  const value = String(target ?? "").trim().toLowerCase();
  if (value === "prod") return "production";
  return value;
}

function parseArgs(argv) {
  const input = {
    aliases: [],
    appliedAliases: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] ?? "";

    if (arg === "--target" || arg === "--deploy-target") input.deployTarget = next();
    else if (arg === "--alias") input.aliases.push(next());
    else if (arg === "--aliases") input.aliases.push(...splitAliases(next()));
    else if (arg === "--applied-alias") input.appliedAliases.push(next());
    else if (arg === "--applied-aliases") input.appliedAliases.push(...splitAliases(next()));
    else if (arg === "--alias-requested") input.aliasRequested = true;
    else if (arg === "--human-gate") input.humanGate = next();
    else if (arg === "--production-alias-config") input.productionAliasConfig = next();
    else if (arg === "--receipt") input.receiptPath = next();
    else if (arg === "--json") input.json = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!input.aliases.length && process.env.DEPLOY_ALIASES) input.aliases = splitAliases(process.env.DEPLOY_ALIASES);
  if (!input.appliedAliases.length && process.env.DEPLOY_APPLIED_ALIASES) {
    input.appliedAliases = splitAliases(process.env.DEPLOY_APPLIED_ALIASES);
  }

  return input;
}

function writeReceipt(filePath, receipt) {
  const absolute = path.resolve(process.cwd(), filePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(receipt, null, 2)}\n`);
}

function main() {
  let input;
  try {
    input = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  const result = evaluateAliasGuard(input);
  if (input.receiptPath) writeReceipt(input.receiptPath, result.receipt);

  if (input.json || input.receiptPath) {
    console.log(JSON.stringify(result.receipt, null, 2));
  } else {
    console.log(`alias_guard_result=${result.receipt.alias_guard_result}`);
    console.log(`deploy_target=${result.receipt.deploy_target}`);
    console.log(`alias_requested=${JSON.stringify(result.receipt.alias_requested)}`);
    console.log(`alias_applied=${JSON.stringify(result.receipt.alias_applied)}`);
    for (const reason of result.receipt.reasons) {
      console.log(`reason=${reason.reason}: ${reason.detail}`);
    }
  }

  process.exit(result.ok ? 0 : 1);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main();
}
