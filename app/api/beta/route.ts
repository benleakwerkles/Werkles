import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    {
      error: "This beta signup form is closed. Use the account doorway to join public testing.",
      state: "Closed"
    },
    { status: 503 }
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
