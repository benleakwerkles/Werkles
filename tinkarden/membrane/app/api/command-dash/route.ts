import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_PORTS = ["3340", "3002", "3001", "3000"];

function commandDashPorts() {
  const configured = process.env.WERKLES_COMMAND_DASH_PORT?.trim();
  return configured ? [configured, ...DEFAULT_PORTS.filter((port) => port !== configured)] : DEFAULT_PORTS;
}

async function proxyCommandDash(method: "GET" | "POST", body?: string) {
  const errors: string[] = [];

  for (const port of commandDashPorts()) {
    const target = `http://127.0.0.1:${port}/api/tinkerden/command-surface`;
    try {
      const response = await fetch(target, {
        method,
        cache: "no-store",
        headers: method === "POST" ? { "content-type": "application/json" } : undefined,
        body: method === "POST" ? body : undefined
      });
      const payload = await response.json();
      return NextResponse.json(
        {
          ...payload,
          command_dash_proxy: {
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
      error: "COMMAND_DASH_UPSTREAM_UNREACHABLE",
      attempts: errors
    },
    { status: 502 }
  );
}

export async function GET() {
  return proxyCommandDash("GET");
}

export async function POST(request: Request) {
  return proxyCommandDash("POST", await request.text());
}
