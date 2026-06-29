import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type IntakePacket = {
  packet_id: string;
  created_at: string;
  status: "DRAFT";
  title: string;
  target_aeye: string;
  target_machine: string;
  mission: string;
  purpose: string;
  return_destination: string;
};

const REQUIRED_FIELDS = [
  "title",
  "target_aeye",
  "target_machine",
  "mission",
  "purpose",
  "return_destination"
] as const;

function packetId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `td_packet_${stamp}_${suffix}`;
}

async function readPackets(storePath: string) {
  try {
    return JSON.parse(await readFile(storePath, "utf8")) as unknown[];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Record<(typeof REQUIRED_FIELDS)[number], string>>;
  const missing = REQUIRED_FIELDS.filter((field) => !body[field]?.trim());

  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS", missing }, { status: 400 });
  }

  const packet: IntakePacket = {
    packet_id: packetId(),
    created_at: new Date().toISOString(),
    status: "DRAFT",
    title: body.title!.trim(),
    target_aeye: body.target_aeye!.trim(),
    target_machine: body.target_machine!.trim(),
    mission: body.mission!.trim(),
    purpose: body.purpose!.trim(),
    return_destination: body.return_destination!.trim()
  };

  const dataDir = path.join(process.cwd(), "data");
  const storePath = path.join(dataDir, "packets.json");
  await mkdir(dataDir, { recursive: true });

  const packets = await readPackets(storePath);
  packets.unshift(packet);
  await writeFile(storePath, `${JSON.stringify(packets, null, 2)}\n`, "utf8");

  return NextResponse.json({ ok: true, packet });
}
