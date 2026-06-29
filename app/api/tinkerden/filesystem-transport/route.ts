import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TRANSPORT_FOLDERS = ["outbox", "sent", "receipts", "assimilated", "failed"] as const;
const MESSAGE_TYPES = new Set([
  "birdie_packet",
  "wormeye_packet",
  "swateye_packet",
  "receipt",
  "inheritance_entry",
  "change_capsule"
]);

type TransportFolder = (typeof TRANSPORT_FOLDERS)[number];
type TransportMessage = Record<string, unknown> & {
  message_type?: string;
  source_file?: string;
  source_folder?: TransportFolder;
  modified_at?: string;
};

function transportRoot() {
  return path.join(process.cwd(), "data", "tinkerden");
}

async function readFolder(folder: TransportFolder): Promise<TransportMessage[]> {
  const dir = path.join(transportRoot(), folder);
  await mkdir(dir, { recursive: true });

  const entries = await readdir(dir, { withFileTypes: true });
  const messages = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        const [raw, fileStat] = await Promise.all([readFile(fullPath, "utf8"), stat(fullPath)]);
        const parsed = JSON.parse(raw) as TransportMessage;

        return {
          ...parsed,
          message_type: MESSAGE_TYPES.has(String(parsed.message_type)) ? parsed.message_type : "unknown",
          source_file: `data/tinkerden/${folder}/${entry.name}`,
          source_folder: folder,
          modified_at: fileStat.mtime.toISOString()
        };
      })
  );

  return messages.sort((a, b) => String(b.modified_at).localeCompare(String(a.modified_at)));
}

export async function GET() {
  try {
    const folderEntries = await Promise.all(
      TRANSPORT_FOLDERS.map(async (folder) => [folder, await readFolder(folder)] as const)
    );
    const folders = Object.fromEntries(folderEntries) as Record<TransportFolder, TransportMessage[]>;

    return NextResponse.json({
      ok: true,
      root: "data/tinkerden",
      folders,
      counts: Object.fromEntries(TRANSPORT_FOLDERS.map((folder) => [folder, folders[folder].length]))
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "filesystem transport read failed" },
      { status: 500 }
    );
  }
}
