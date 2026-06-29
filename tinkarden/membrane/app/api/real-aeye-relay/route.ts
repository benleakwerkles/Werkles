import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_PORTS = ["3002", "3001", "3000"];

function commandDashPorts() {
  const configured = process.env.WERKLES_COMMAND_DASH_PORT?.trim();
  return configured ? [configured, ...DEFAULT_PORTS.filter((port) => port !== configured)] : DEFAULT_PORTS;
}

async function proxyRealRelay(method: "GET" | "POST" | "PATCH", body?: string, search = "") {
  const errors: string[] = [];

  for (const port of commandDashPorts()) {
    const target = `http://127.0.0.1:${port}/api/tinkerden/real-aeye-relay${search}`;
    try {
      const response = await fetch(target, {
        method,
        cache: "no-store",
        headers: method === "GET" ? undefined : { "content-type": "application/json" },
        body: method === "GET" ? undefined : body
      });
      const payload = await response.json();
      return NextResponse.json(
        {
          ...payload,
          real_aeye_relay_proxy: {
            target,
            status: response.status
          }
        },
        { status: response.status }
      );
    } catch (error) {
      errors.push(`${target}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error: "REAL_AEYE_RELAY_UPSTREAM_UNREACHABLE",
      attempts: errors
    },
    { status: 502 }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyRealRelay("GET", undefined, url.search);
}

export async function POST(request: Request) {
  return proxyRealRelay("POST", await request.text());
}

export async function PATCH(request: Request) {
  return proxyRealRelay("PATCH", await request.text());
}

export const PUT = PATCH;
