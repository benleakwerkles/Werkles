import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Artifact = {
  artifact_id: string;
  name: string;
  owner: string;
  machine: string;
  status: string;
  path: string;
  url: string;
  created_at: string;
  receipt: unknown;
};

type ArtifactRegistry = {
  registry_id: string;
  name: string;
  owner: string;
  machine: string;
  created_at: string;
  artifacts: Artifact[];
};

const REGISTRY_PATH = join(process.cwd(), "foreman", "artifacts", "ARTIFACT_REGISTRY_V0.json");
const STOP_WORDS = new Set(["audit", "find", "locate", "show", "get", "the", "a", "an", "artifact"]);

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw) as ArtifactRegistry;
}

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token));
}

function scoreArtifact(artifact: Artifact, request: string) {
  const requestTokens = tokens(request);
  const haystack = tokens(`${artifact.artifact_id} ${artifact.name}`);
  if (!requestTokens.length) return 0;
  return requestTokens.filter((token) => haystack.includes(token)).length;
}

function lookupArtifact(registry: ArtifactRegistry, request: string) {
  const direct = registry.artifacts.find(
    (artifact) =>
      artifact.artifact_id.toLowerCase() === request.toLowerCase() ||
      artifact.name.toLowerCase() === request.toLowerCase()
  );
  if (direct) return direct;

  const scored = registry.artifacts
    .map((artifact) => ({ artifact, score: scoreArtifact(artifact, request) }))
    .sort((left, right) => right.score - left.score);

  return scored[0]?.score ? scored[0].artifact : null;
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  const registry = await readRegistry();
  const requested = request.nextUrl.searchParams.get("request") || request.nextUrl.searchParams.get("q");
  if (!requested) return json(registry);

  const artifact = lookupArtifact(registry, requested);
  return json({
    registry_id: registry.registry_id,
    request: requested,
    matched: Boolean(artifact),
    artifact,
  }, artifact ? 200 : 404);
}

export async function POST(request: NextRequest) {
  const registry = await readRegistry();
  const body = (await request.json().catch(() => ({}))) as { request?: string; artifact_id?: string; name?: string };
  const requested = body.request || body.artifact_id || body.name || "";
  const artifact = lookupArtifact(registry, requested);

  return json({
    registry_id: registry.registry_id,
    request: requested,
    matched: Boolean(artifact),
    artifact,
  }, artifact ? 200 : 404);
}
