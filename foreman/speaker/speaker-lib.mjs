/**
 * Speaker office — read/write causal entries (local repo only).
 * DRAFT writes only. No delete. No ratify. No exec.
 */

import fs from "node:fs";
import path from "node:path";

export const SPEAKER_DIR = path.join("foreman", "speaker");
export const SPEAKER_ENTRIES_DIR = path.join(SPEAKER_DIR, "entries");

const ENTRY_STATUSES = new Set(["DRAFT", "RATIFIED", "SUPERSEDED"]);

function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: text.trim() };

  const meta = {};
  let currentListKey = null;

  for (const line of match[1].split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentListKey) {
      if (!Array.isArray(meta[currentListKey])) meta[currentListKey] = [];
      meta[currentListKey].push(listItem[1].trim());
      continue;
    }

    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (!kv) continue;
    const key = kv[1];
    const raw = kv[2].trim();
    currentListKey = raw === "" ? key : null;

    if (raw.startsWith("[") && raw.endsWith("]")) {
      meta[key] = raw
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (raw === "") {
      meta[key] = [];
    } else {
      meta[key] = raw.replace(/^["']|["']$/g, "");
      currentListKey = null;
    }
  }

  const body = text.slice(match[0].length).trim();
  return { meta, body };
}

function listEntryFiles(root) {
  const dir = path.join(root, SPEAKER_ENTRIES_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(dir, f));
}

export function loadSpeakerEntries(repoRoot) {
  return listEntryFiles(repoRoot)
    .map((abs) => {
      const text = fs.readFileSync(abs, "utf8");
      const { meta, body } = parseFrontMatter(text);
      const filename = path.basename(abs, ".md");
      return {
        id: meta.id || filename,
        status: meta.status || "DRAFT",
        title: meta.title || filename,
        created_at: meta.created_at || "",
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        warning_triggers: Array.isArray(meta.warning_triggers) ? meta.warning_triggers : [],
        source_notes: Array.isArray(meta.source_notes) ? meta.source_notes : [],
        related_entries: Array.isArray(meta.related_entries) ? meta.related_entries : [],
        path: path.join(SPEAKER_ENTRIES_DIR, path.basename(abs)).replace(/\\/g, "/"),
        preview: body.slice(0, 480) + (body.length > 480 ? "…" : ""),
        body,
      };
    })
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "") || b.id.localeCompare(a.id));
}

export function loadRoleRegistrySummary(repoRoot) {
  const registryPath = path.join(repoRoot, SPEAKER_DIR, "AEYE_ROLE_REGISTRY.md");
  if (!fs.existsSync(registryPath)) return { path: null, roles: [] };
  const text = fs.readFileSync(registryPath, "utf8");
  const roles = [];
  for (const line of text.split(/\r?\n/)) {
    const row = line.match(/^\|\s*\*\*([^*]+)\*\*\s*\|/);
    if (row && !row[1].includes("---") && row[1] !== "Role" && row[1] !== "Office" && row[1] !== "Seat") {
      roles.push(row[1].trim());
    }
  }
  return {
    path: `${SPEAKER_DIR}/AEYE_ROLE_REGISTRY.md`.replace(/\\/g, "/"),
    roles: [...new Set(roles)].slice(0, 24),
  };
}

export function findWarnings(repoRoot, query = "") {
  const q = query.toLowerCase();
  const entries = loadSpeakerEntries(repoRoot).filter((e) => e.status !== "SUPERSEDED");
  if (!q) {
    return entries.filter((e) => e.status === "RATIFIED" || e.warning_triggers.length > 0);
  }
  return entries.filter((e) => {
    const hay = [e.title, e.id, ...(e.tags || []), ...(e.warning_triggers || []), e.body]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function slugify(title) {
  return String(title || "entry")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function splitList(value, fallback = []) {
  if (Array.isArray(value)) return value;
  const s = String(value || "").trim();
  if (!s) return fallback;
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function field(payload, ...keys) {
  for (const key of keys) {
    const v = payload[key];
    if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
  }
  return "";
}

export function draftSpeakerEntry(repoRoot, payload) {
  const title = field(payload, "title");
  const lesson = field(payload, "lesson", "lesson_learned");
  if (!title || !lesson) {
    throw new Error("title and lesson are required");
  }

  const date = new Date();
  const ymd =
    String(date.getFullYear()) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const slug = slugify(title);
  const id = `DRAFT_${ymd}-${slug}`;

  const entriesDir = path.join(repoRoot, SPEAKER_ENTRIES_DIR);
  fs.mkdirSync(entriesDir, { recursive: true });

  const filename = `${id}.md`;
  const abs = path.join(entriesDir, filename);
  if (fs.existsSync(abs)) {
    throw new Error(`Entry already exists: ${filename}`);
  }

  const tags = splitList(payload.tags, ["operator"]);
  const warningTriggers = splitList(payload.warning_triggers, []);
  const sourceNotes = splitList(payload.source_notes, ["foreman/speaker/SPEAKER_PACKET_TEMPLATE.md"]);

  const event = field(payload, "event") || "_To be filled._";
  const context = field(payload, "context") || "_To be filled._";
  const decision = field(payload, "decision") || "_To be filled._";
  const why = field(payload, "why", "why_it_happened") || "_To be filled._";
  const risk = field(payload, "risk", "risk_exposed") || "_To be filled._";
  const doctrine = field(payload, "doctrine", "doctrine_changed") || "none";
  const who = field(payload, "who", "who_must_remember") || "_To be filled._";
  const futureWarning = field(payload, "future_warning", "warning_signature") || "_To be filled._";

  const body = `---
id: ${id}
status: DRAFT
title: ${title}
created_at: ${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}
source_notes:
${sourceNotes.map((n) => `  - ${n}`).join("\n")}
tags:
${tags.map((t) => `  - ${t}`).join("\n")}
warning_triggers:
${warningTriggers.map((t) => `  - ${t}`).join("\n")}
related_entries: []
---

## Event

${event}

## Context

${context}

## Decision

${decision}

## Why it happened

${why}

## Risk exposed

${risk}

## Lesson learned

${lesson}

## Doctrine changed

${doctrine}

## Who must remember

${who}

## Future warning

${futureWarning}

## Source artifacts

${sourceNotes.map((n) => `- ${n}`).join("\n")}
`;

  fs.writeFileSync(abs, body, "utf8");

  return {
    ok: true,
    id,
    status: "DRAFT",
    path: path.join(SPEAKER_ENTRIES_DIR, filename).replace(/\\/g, "/"),
    message: "DRAFT entry written — Ben must ratify before canonical",
  };
}

export function buildSpeakerStatus(repoRoot) {
  const entries = loadSpeakerEntries(repoRoot);
  const roleRegistry = loadRoleRegistrySummary(repoRoot);
  return {
    ok: true,
    office: "Speaker",
    charter: `${SPEAKER_DIR}/SPEAKER_CHARTER.md`,
    ledger: `${SPEAKER_DIR}/CAUSAL_LEDGER.md`,
    integration: `${SPEAKER_DIR}/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md`,
    roleRegistry,
    entries,
    warnings: findWarnings(repoRoot),
    counts: {
      draft: entries.filter((e) => e.status === "DRAFT").length,
      ratified: entries.filter((e) => e.status === "RATIFIED").length,
      superseded: entries.filter((e) => e.status === "SUPERSEDED").length,
    },
  };
}

export function validateEntryStatus(status) {
  return ENTRY_STATUSES.has(status);
}
