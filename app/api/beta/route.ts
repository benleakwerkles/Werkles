import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

const laneMap: Record<string, string> = {
  builder: "Builder",
  operator: "Operator",
  backer: "Backer",
  connector: "Connector",
  spark: "Spark",
  Builder: "Builder",
  Operator: "Operator",
  Backer: "Backer",
  Connector: "Connector",
  Spark: "Spark"
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const lane = laneMap[String(body?.lane || "").trim()] || null;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const { error } = await getSupabaseService()
      .from("beta_signups")
      .insert({ email, lane });

    if (error) {
      const code = String(error.code || "");
      if (code === "23505") {
        return NextResponse.json(
          { success: true, note: "Already on the list — we will follow up." },
          { status: 200 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      note: "Saved. No automated email — use /signup for a full account with email confirmation."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save beta signup";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
