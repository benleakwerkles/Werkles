#!/usr/bin/env node
"use strict";

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

function loadEnvFile(filePath) {
  return readFile(filePath, "utf8").then((content) => {
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index <= 0) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

function projectRefFromSupabaseUrl(urlValue) {
  const hostname = new URL(urlValue).hostname;
  const ref = hostname.split(".")[0];
  if (!ref) throw new Error("Could not parse Supabase project ref from NEXT_PUBLIC_SUPABASE_URL");
  return ref;
}

function buildDatabaseUrl(ref, password) {
  const direct = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  return process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || direct;
}

async function verifyTables(client) {
  const { rows } = await client.query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and table_name in ('discovery_intakes', 'matching_shadow_runs')
     order by table_name`
  );
  return rows.map((row) => row.table_name);
}

async function main() {
  const envFile = process.argv[2];
  if (envFile) await loadEnvFile(envFile);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const dbPassword = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  if (!dbPassword) throw new Error("SUPABASE_DB_PASSWORD is required for DDL apply");

  const ref = projectRefFromSupabaseUrl(supabaseUrl);
  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "00004_matching_shadow_persistence.sql"
  );
  const sql = await readFile(migrationPath, "utf8");

  let pg;
  try {
    pg = require("pg");
  } catch {
    throw new Error("pg package is required. Run: npm install pg --no-save");
  }

  const client = new pg.Client({
    connectionString: buildDatabaseUrl(ref, dbPassword),
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const before = await verifyTables(client);
    if (before.length === 2) {
      process.stdout.write(
        JSON.stringify({
          ok: true,
          schema: "WERKLES_MATCHING_SCHEMA_APPLY_V1",
          status: "already_applied",
          tables: before
        }) + "\n"
      );
      return;
    }

    await client.query(sql);
    const after = await verifyTables(client);
    const ok = after.length === 2;
    process.stdout.write(
      JSON.stringify({
        ok,
        schema: "WERKLES_MATCHING_SCHEMA_APPLY_V1",
        status: ok ? "applied" : "partial",
        tables: after
      }) + "\n"
    );
    if (!ok) process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  process.stdout.write(
    JSON.stringify({
      ok: false,
      schema: "WERKLES_MATCHING_SCHEMA_APPLY_V1",
      error: error.message
    }) + "\n"
  );
  process.exit(1);
});
