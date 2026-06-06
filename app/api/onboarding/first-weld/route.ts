import { NextRequest, NextResponse } from "next/server";
import { copy } from "@/lib/copy";
import { getSupabaseService } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/request";

export const runtime = "nodejs";

type ZipPlace = {
  "place name": string;
  "state abbreviation": string;
  latitude: string;
  longitude: string;
};

async function resolveZip(zip: string) {
  const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
    next: { revalidate: 60 * 60 * 24 * 30 }
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const place = payload.places?.[0] as ZipPlace | undefined;

  if (!place) {
    return null;
  }

  return {
    zip,
    city: place["place name"],
    state: place["state abbreviation"],
    lat: Number(place.latitude),
    lng: Number(place.longitude)
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const lane = String(body.lane || "Builder");
  const arena = String(body.arena || "").trim();
  const turf = String(body.turf || "").replace(/\D/g, "").slice(0, 5);

  if (!(copy.laneOptions as readonly string[]).includes(lane)) {
    return NextResponse.json({ error: "Pick a valid lane." }, { status: 400 });
  }

  if (!arena || turf.length !== 5) {
    return NextResponse.json({ error: "Arena and a valid ZIP are required." }, { status: 400 });
  }

  const zip = await resolveZip(turf);
  if (!zip) {
    return NextResponse.json({ error: "That turf did not resolve cleanly. Check the ZIP and try again." }, { status: 404 });
  }

  const supabase = getSupabaseService();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: auth.user.id,
      email: auth.user.email,
      display_name: auth.user.email?.split("@")[0] || "Werkles Builder",
      lane,
      industry_tags: [arena],
      location_city: zip.city,
      location_state: zip.state,
      location_lat: zip.lat,
      location_lng: zip.lng,
      turf_zip: turf,
      work_preference: "Local Only"
    },
    { onConflict: "id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
