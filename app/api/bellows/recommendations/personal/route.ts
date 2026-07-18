import { NextRequest, NextResponse } from "next/server";

import { recommendationSessionFromMemberProfile } from "@/lib/matching/profile-recommendation";
import type { MemberMatchingProfile } from "@/lib/matching/signals";
import { requireUser } from "@/lib/supabase/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PROFILE_MATCHING_COLUMNS = [
  "primary_goal",
  "blueprint_narrative",
  "skills_offered",
  "skills_sought",
  "industry_tags",
  "lane",
  "work_preference",
  "location_city",
  "location_state",
  "timeline_to_launch"
].join(",");

function privateNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Vary", "Authorization");
  return response;
}

function privateJson(body: unknown, status = 200) {
  return privateNoStore(NextResponse.json(body, { status }));
}

/**
 * The caller supplies only its bearer token. Ownership comes exclusively from
 * requireUser(); query strings, bodies, and caller-provided IDs are not read.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return privateNoStore(auth.response);

  const { data, error } = await auth.supabase
    .from("profiles")
    .select(PROFILE_MATCHING_COLUMNS)
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return privateJson({ error: "Your private recommendation could not be loaded." }, 500);
  }

  const session = recommendationSessionFromMemberProfile((data ?? {}) as MemberMatchingProfile);
  if (!session) {
    return privateJson({ success: true, persisted: false, status: "profile_required" });
  }

  return privateJson({ success: true, persisted: false, status: "personal", session });
}
