import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SWANSON_RELAY_BASE = process.env.SWANSON_RELAY_BASE_URL || "http://127.0.0.1:3339";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function targetUrl(request: Request, pathParts: string[]) {
  const sourceUrl = new URL(request.url);
  const target = new URL(`/v1/${pathParts.join("/")}`, SWANSON_RELAY_BASE);
  target.search = sourceUrl.search;
  return target;
}

async function forward(request: Request, context: RouteContext) {
  const { path } = await context.params;
  if (!Array.isArray(path) || path.length === 0) {
    return NextResponse.json({ ok: false, error: "SWANSON_RELAY_PATH_REQUIRED" }, { status: 400 });
  }

  const target = targetUrl(request, path);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        "content-type": request.headers.get("content-type") || "application/json"
      },
      body,
      cache: "no-store"
    });
    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
        "x-thinkit-swanson-target": target.toString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "SWANSON_RELAY_PROXY_BLOCKED",
        target: target.toString(),
        error: error instanceof Error ? error.message : "Swanson relay proxy failed"
      },
      { status: 502 }
    );
  }
}

export async function GET(request: Request, context: RouteContext) {
  return forward(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return forward(request, context);
}

