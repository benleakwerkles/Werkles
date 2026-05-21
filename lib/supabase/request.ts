import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { requireEnv } from "./env";

type AuthenticatedClient =
  | {
      supabase: SupabaseClient;
      user: User;
    }
  | {
      response: NextResponse;
    };

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export function getSupabaseForRequest(request: NextRequest) {
  const token = bearerToken(request);

  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      global: token
        ? {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        : undefined,
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function requireUser(request: NextRequest): Promise<AuthenticatedClient> {
  const token = bearerToken(request);
  if (!token) {
    return {
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 })
    };
  }

  const supabase = getSupabaseForRequest(request);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      response: NextResponse.json({ error: "Invalid session" }, { status: 401 })
    };
  }

  return { supabase, user: data.user };
}
