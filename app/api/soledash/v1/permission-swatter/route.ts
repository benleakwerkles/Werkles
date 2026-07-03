import { NextRequest, NextResponse } from "next/server";
import { classifyPermissionPrompt, permissionSwatterManifest, type PermissionPrompt } from "@/lib/permission-swatter";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(permissionSwatterManifest());
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as PermissionPrompt;
  return NextResponse.json(classifyPermissionPrompt(body));
}
