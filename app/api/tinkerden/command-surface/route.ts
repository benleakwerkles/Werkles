import { NextResponse } from "next/server";

import { createTinkerdenCommandSurfaceReceipt } from "@/lib/tinkerden/command-surface";

export const dynamic = "force-dynamic";

type CommandSurfaceBody = {
  command?: string;
  destination_id?: string;
  source_surface?: string;
  stream?: string;
  command_type?: string;
};

export async function GET() {
  const { readTinkerdenCommandDestinations } = await import("@/lib/tinkerden/command-surface");

  return NextResponse.json({
    ok: true,
    routing_rule: "verified destinations only",
    destinations: await readTinkerdenCommandDestinations()
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CommandSurfaceBody;
    const result = await createTinkerdenCommandSurfaceReceipt(body.command ?? "", body.destination_id ?? "", {
      source_surface: body.source_surface,
      stream: body.stream,
      command_type: body.command_type
    });

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "COMMAND_SURFACE_FAILED";
    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: message === "COMMAND_REQUIRED" || message === "VERIFIED_DESTINATION_REQUIRED" ? 400 : 500 }
    );
  }
}
