#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const writeMode = process.argv.includes("--write");

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

function resolveDeclaredPath(value) {
  if (!value) return null;
  return path.resolve(value);
}

function envValue(names = []) {
  for (const name of names) {
    if (process.env[name]) return { name, value: process.env[name] };
  }
  return null;
}

function columnGroupSatisfied(columns, group) {
  const lower = new Set(columns.map((column) => column.toLowerCase()));
  return String(group)
    .split("/")
    .some((candidate) => lower.has(candidate.toLowerCase()));
}

async function inspectSqlite(surface, resolvedPath) {
  if (!existsSync(resolvedPath)) {
    return {
      status: "MISSING",
      exists: false,
      tables_seen: [],
      table_checks: [],
      missing: [resolvedPath],
    };
  }

  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(resolvedPath, { readOnly: true });
  try {
    const tables = db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all().map((row) => row.name);
    const missing = [];
    const tableChecks = [];

    for (const table of surface.required_tables || []) {
      if (!tables.includes(table)) {
        missing.push(`table:${table}`);
        tableChecks.push({ table, status: "MISSING_TABLE", columns_seen: [] });
        continue;
      }

      const columns = db.prepare(`PRAGMA table_info("${String(table).replaceAll('"', '""')}")`).all().map((column) => column.name);
      const requiredGroups = surface.required_columns?.[table] || [];
      const columnChecks = requiredGroups.map((group) => ({
        required: group,
        present: columnGroupSatisfied(columns, group),
      }));
      for (const check of columnChecks) {
        if (!check.present) missing.push(`column:${table}.${check.required}`);
      }
      tableChecks.push({
        table,
        status: columnChecks.every((check) => check.present) ? "PASS" : "MISSING_COLUMNS",
        columns_seen: columns,
        column_checks: columnChecks,
      });
    }

    return {
      status: missing.length ? "BLOCKER" : "PASS",
      exists: true,
      byte_count: statSync(resolvedPath).size,
      sha256: sha256File(resolvedPath),
      tables_seen: tables,
      table_checks: tableChecks,
      missing,
    };
  } finally {
    db.close();
  }
}

function inspectJson(surface, resolvedPath) {
  if (!existsSync(resolvedPath)) {
    return {
      status: "MISSING",
      exists: false,
      missing: [resolvedPath],
    };
  }

  const text = readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(text);
  const missing = [];
  if (surface.surface === "wormeyes_world_state" && !Array.isArray(parsed.files)) {
    missing.push("files[]");
  }

  return {
    status: missing.length ? "BLOCKER" : "PASS",
    exists: true,
    byte_count: Buffer.byteLength(text, "utf8"),
    sha256: createHash("sha256").update(text, "utf8").digest("hex").toUpperCase(),
    top_level_keys: Object.keys(parsed).sort(),
    missing,
  };
}

function inspectDirectory(surface, resolvedPath, fallbackPath) {
  const primaryExists = existsSync(resolvedPath);
  const fallbackExists = fallbackPath ? existsSync(fallbackPath) : false;
  const effectivePath = primaryExists ? resolvedPath : fallbackExists ? fallbackPath : resolvedPath;
  const exists = primaryExists || fallbackExists;
  return {
    status: primaryExists ? "PASS" : fallbackExists ? "FALLBACK_PRESENT" : "MISSING",
    exists,
    primary_path: resolvedPath,
    fallback_path: fallbackPath || null,
    effective_path: effectivePath,
    missing: exists ? [] : [resolvedPath],
  };
}

async function inspectSurface(surface) {
  const env = envValue(surface.alternate_env);
  const canonicalPath = resolveDeclaredPath(surface.canonical_path);
  const resolvedPath = resolveDeclaredPath(env?.value || surface.canonical_path);
  const fallbackPath = surface.fallback_path ? resolveDeclaredPath(surface.fallback_path) : null;
  let inspection;

  if (surface.surface === "production_circulation_db") {
    inspection = await inspectSqlite(surface, resolvedPath);
  } else if (surface.surface === "wormeyes_world_state") {
    inspection = inspectJson(surface, resolvedPath);
  } else {
    inspection = inspectDirectory(surface, resolvedPath, fallbackPath);
  }

  return {
    surface: surface.surface,
    declared_status: surface.current_status || null,
    canonical_path: canonicalPath,
    env_override: env,
    resolved_path: resolvedPath,
    blocked_organs: surface.blocked_organs || [],
    ...inspection,
  };
}

const contractPath = repoPath("foreman", "source-truth", "NERDKLE_PRODUCTION_INPUT_CONTRACT.json");
if (!existsSync(contractPath)) {
  throw new Error(`Missing ${rel(contractPath)}`);
}

const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const surfaces = [];
for (const surface of contract.required_surfaces || []) {
  surfaces.push(await inspectSurface(surface));
}

const blockers = surfaces.flatMap((surface) => {
  if (surface.status === "PASS" || surface.status === "FALLBACK_PRESENT") return [];
  return (surface.missing || []).map((missing) => ({
    surface: surface.surface,
    missing,
    blocked_organs: surface.blocked_organs,
  }));
});

const readback = {
  readback_id: "NERDKLE_PRODUCTION_INPUT_READBACK",
  created_at: new Date().toISOString(),
  owner: "Swanson@Doss",
  machine: "Doss",
  status: blockers.length ? "BLOCKER" : "PASS",
  contract_path: rel(contractPath),
  contract_hash: sha256File(contractPath),
  source_truth_rule: contract.source_truth_rule,
  surfaces,
  blockers,
  false_go_cases: contract.false_go_cases || [],
  next_packet: contract.next_packet || null,
};

if (writeMode) {
  const readbackDir = repoPath("foreman", "source-truth", "readbacks");
  const receiptDir = repoPath("foreman", "source-truth", "receipts", "inputs");
  mkdirSync(readbackDir, { recursive: true });
  mkdirSync(receiptDir, { recursive: true });

  const readbackPath = path.join(readbackDir, "NERDKLE_PRODUCTION_INPUT_READBACK.json");
  writeFileSync(readbackPath, `${JSON.stringify(readback, null, 2)}\n`, "utf8");
  const receipt = {
    receipt_id: "NERDKLE_PRODUCTION_INPUT_READBACK_RECEIPT",
    mission: "NERDKLE_PRODUCTION_INPUT_READBACK",
    owner: "Swanson@Doss",
    created_at: new Date().toISOString(),
    status: "ARTIFACT",
    readback_status: readback.status,
    readback_path: rel(readbackPath),
    readback_hash: sha256File(readbackPath),
    readback_byte_count: statSync(readbackPath).size,
    blocker_count: blockers.length,
    canonical_promotion: "NO",
  };
  const receiptPath = path.join(receiptDir, "NERDKLE_PRODUCTION_INPUT_READBACK_RECEIPT.json");
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  readback.receipt = {
    path: rel(receiptPath),
    hash: sha256File(receiptPath),
    byte_count: statSync(receiptPath).size,
  };
}

process.stdout.write(`${JSON.stringify(readback, null, 2)}\n`);
