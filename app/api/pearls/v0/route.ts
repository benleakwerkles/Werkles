import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  createEmptyPearlRegistry,
  createPearl,
  transitionPearl,
  type PearlRegistry,
  type PearlState,
} from "@/lib/pearl-promotion-pipeline";

export const runtime = "nodejs";

const REGISTRY_PATH = join(process.cwd(), "foreman", "pearls", "PEARL_REGISTRY_V0.json");

async function readRegistry() {
  try {
    const raw = await readFile(REGISTRY_PATH, "utf8");
    return JSON.parse(raw) as PearlRegistry;
  } catch {
    return createEmptyPearlRegistry();
  }
}

async function writeRegistry(registry: PearlRegistry) {
  await mkdir(dirname(REGISTRY_PATH), { recursive: true });
  await writeFile(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function GET() {
  return json(await readRegistry());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "discover").toLowerCase();
  const registry = await readRegistry();

  try {
    if (action === "discover") {
      const result = createPearl(registry, {
        pearl_id: body.pearl_id,
        title: body.title || body.name || "Untitled crawler discovery",
        source: body.source,
        note: body.note,
      });
      await writeRegistry(result.registry);
      return json(result);
    }

    if (action === "transition" || action === "promote") {
      const targetState = (action === "promote" ? "PROMOTED" : body.state) as PearlState;
      const result = transitionPearl(registry, String(body.pearl_id || ""), targetState);
      await writeRegistry(result.registry);
      return json(result);
    }

    return json({ ok: false, error: `Unknown pearl action: ${action}` }, 400);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Pearl pipeline failed" }, 400);
  }
}
