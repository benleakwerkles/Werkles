#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const SPEAKER_ROOT = process.env.SPEAKER_ROOT || path.resolve(__dirname, "..");
const RULE_PATH = process.env.SPEAKER_SCHEMA_RULES || path.join(SPEAKER_ROOT, "db", "schema_rules.json");

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

function readRules() {
  const raw = fs.readFileSync(RULE_PATH);
  return {
    raw,
    json: JSON.parse(raw.toString("utf8")),
  };
}

function firstNonEmptyLine(lines) {
  return lines.find((line) => line.trim() !== "") || "";
}

function validatePacketText(text, rules) {
  const errors = [];
  const spec = rules.unified_packet_spec || {};
  const boundaryLiteral = spec.boundary_key && spec.boundary_key.literal;
  const terminalLiteral = spec.termination_key && spec.termination_key.literal;
  const forbidden = Array.isArray(spec.forbidden_boundary_patterns) ? spec.forbidden_boundary_patterns : [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const first = firstNonEmptyLine(lines);
  const finalNonEmpty = [...lines].reverse().find((line) => line.trim() !== "") || "";

  if (!boundaryLiteral || boundaryLiteral !== "PACKET_ID:") {
    errors.push("boundary_key.literal must be PACKET_ID:");
  }

  if (!terminalLiteral || terminalLiteral !== "***") {
    errors.push("termination_key.literal must be ***");
  }

  if (!first.startsWith("PACKET_ID:")) {
    errors.push("first non-empty line must begin with PACKET_ID:");
  }

  if (finalNonEmpty !== "***") {
    errors.push("final non-empty line must be standalone ***");
  }

  const packetStarts = lines
    .map((line, index) => ({ line, index }))
    .filter((entry) => entry.line.startsWith("PACKET_ID:"));
  if (packetStarts.length !== 1) {
    errors.push(`exactly one PACKET_ID: boundary expected per packet; found ${packetStarts.length}`);
  }

  for (const pattern of forbidden) {
    if (text.includes(pattern)) {
      errors.push(`forbidden wrapper or styling pattern present: ${pattern}`);
    }
  }

  return errors;
}

function packetFromTemplate(template) {
  if (!Array.isArray(template)) {
    throw new Error("unified_packet_spec.canonical_template must be an array of lines");
  }
  return `${template.join("\n")}\n`;
}

function parsePacketStream(text, rules) {
  const stopRegex = new RegExp(rules.clipboard_parser_contract.packet_stop_regex);
  const startRegex = new RegExp(rules.clipboard_parser_contract.packet_start_regex);
  const packets = [];
  let current = null;

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (startRegex.test(line)) {
      if (current) {
        throw new Error(`nested PACKET_ID before terminator at line ${index + 1}`);
      }
      current = [line];
      continue;
    }

    if (!current) {
      if (line.trim() === "") continue;
      throw new Error(`non-empty text before PACKET_ID at line ${index + 1}`);
    }

    current.push(line);
    if (stopRegex.test(line)) {
      packets.push(current.join("\n"));
      current = null;
    }
  }

  if (current) {
    throw new Error("unterminated packet at end of stream");
  }

  return packets;
}

function validateMachineScope(rules) {
  const machines = rules.enforcement_scope && rules.enforcement_scope.machines;
  const required = ["Betsy", "Doss", "Sally"];
  const errors = [];

  for (const name of required) {
    if (!machines || !machines[name] || machines[name].enforce_unified_packet_spec !== true) {
      errors.push(`machine ${name} must enforce unified packet spec`);
    }
  }

  return errors;
}

function main() {
  const startedAt = new Date().toISOString();
  const report = {
    event: "VALIDATE_FENCES",
    status: "UNKNOWN",
    started_at: startedAt,
    rule_path: RULE_PATH,
    checks: [],
    errors: [],
  };

  try {
    const { raw, json } = readRules();
    report.rule_sha256 = sha256Buffer(raw);
    report.rule_id = json.rule_id || null;

    const templatePacket = packetFromTemplate(json.unified_packet_spec.canonical_template);
    const templateErrors = validatePacketText(templatePacket, json);
    report.checks.push({
      check: "canonical_template_packet_boundaries",
      ok: templateErrors.length === 0,
      errors: templateErrors,
    });
    report.errors.push(...templateErrors);

    const machineErrors = validateMachineScope(json);
    report.checks.push({
      check: "betsy_doss_sally_enforcement_scope",
      ok: machineErrors.length === 0,
      errors: machineErrors,
    });
    report.errors.push(...machineErrors);

    const sampleStream = [
      templatePacket.replace("<PACKET_ID>", "SAMPLE_PACKET_ONE"),
      templatePacket.replace("<PACKET_ID>", "SAMPLE_PACKET_TWO"),
    ].join("\n");
    const parsed = parsePacketStream(sampleStream, json);
    report.checks.push({
      check: "two_packet_stream_parse",
      ok: parsed.length === 2,
      parsed_count: parsed.length,
    });
    if (parsed.length !== 2) {
      report.errors.push(`expected two parsed packets, got ${parsed.length}`);
    }

    const pathPacket = templatePacket
      .replace("<PACKET_ID>", "SAMPLE_WINDOWS_PATH_PACKET")
      .replace("<plain text context>", "Path proof: C:\\\\speaker\\\\db\\\\schema_rules.json");
    const pathErrors = validatePacketText(pathPacket, json);
    report.checks.push({
      check: "windows_path_inside_packet_is_literal",
      ok: pathErrors.length === 0,
      errors: pathErrors,
    });
    report.errors.push(...pathErrors);

    report.status = report.errors.length === 0 ? "PASS" : "FAIL";
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(report.status === "PASS" ? 0 : 1);
  } catch (error) {
    report.status = "BLOCKER";
    report.errors.push(error.message);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(2);
  }
}

main();
