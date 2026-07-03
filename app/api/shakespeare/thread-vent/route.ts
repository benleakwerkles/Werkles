import { NextRequest, NextResponse } from "next/server";
import { classifyThreadVent, type ThreadVentInput } from "@/lib/shakespeare-thread-vent";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ThreadVentInput;
  return NextResponse.json(classifyThreadVent(body));
}

export async function GET() {
  return NextResponse.json(
    classifyThreadVent({
      mission: "SHAKESPEARE_THREAD_VENT_V0",
      role: "DINK",
      machine: "SALLY",
      executionContext: "LOCAL_SALLY_WINDOWS",
    })
  );
}
