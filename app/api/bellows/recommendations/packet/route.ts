import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Saving stays closed until the request is bound to an authenticated member,
 * intake, matching run, and recommendation. A feature flag is not an auth gate.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Personal recommendation saving is unavailable while this beta is closed.",
      state: "Blocked"
    },
    { status: 403 }
  );
}
