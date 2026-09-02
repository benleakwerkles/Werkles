#!/usr/bin/env node

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function parseEnvFile(path) {
  const out = {};
  const text = fs.readFileSync(path, "utf8");

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function refFromSupabaseUrl(url) {
  try {
    return new URL(url).host.split(".")[0] || null;
  } catch {
    return null;
  }
}

async function probe(label, envPath) {
  const env = parseEnvFile(envPath);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceRoleKey || anonKey;
  const result = {
    label,
    has_url: Boolean(url),
    has_service_role_key: Boolean(serviceRoleKey),
    has_anon_key: Boolean(anonKey),
    probe_key_type: serviceRoleKey ? "service_role" : anonKey ? "anon_fallback" : "none",
    project_ref: refFromSupabaseUrl(url),
    tables: {},
  };

  if (!url || !key) {
    result.ok = false;
    result.error = "missing_required_env";
    return result;
  }

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const checks = [
    { table: "discovery_intakes", column: "intake_id" },
    { table: "matching_shadow_runs", column: "run_id" },
  ];

  for (const check of checks) {
    const { error } = await client.from(check.table).select(check.column).limit(1);
    result.tables[check.table] = error ? error.code || error.message : "ok";
  }

  result.ok = Object.values(result.tables).every((value) => value === "ok");
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.length % 2 !== 0) {
    throw new Error("Usage: probe-supabase-tables-from-env-file.mjs <label> <env-file> [<label> <env-file>...]");
  }

  const results = [];
  for (let index = 0; index < args.length; index += 2) {
    results.push(await probe(args[index], args[index + 1]));
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: results.every((result) => result.ok),
        schema: "WERKLES_SUPABASE_TABLE_PROBE_FROM_ENV_FILE_V1",
        results,
      },
      null,
      2,
    ) + "\n",
  );
}

main().catch((error) => {
  process.stdout.write(JSON.stringify({ ok: false, error: error.message }) + "\n");
  process.exit(1);
});
