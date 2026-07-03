# BIRD_0096_MAKER_DINK_VELOCITY_SURFACE_RECEIPT

Receipt_ID: BIRD_0096_MAKER_DINK_VELOCITY_SURFACE_RECEIPT
Packet_ID: BIRD_0096_MAKER_DINK_VELOCITY_SURFACE
Status: ARTIFACT
Created_At: 2026-06-27T17:54:00-04:00
Artifact_Path: tinkarden/membrane/app/page.tsx

## Summary

Updated the Feral Membrane on port `3339` into a forward-moving velocity and transaction surface.

The page now renders a **Velocity Header** with live Aeye computation states and token saturation, plus a horizontal **Transaction Conveyor Belt** of action capsules. The conveyor uses a client-side `EventSource` hook backed by a same-origin SSE route that watches Speaker substrate logs with `fs.watch` and pushes velocity/capsule events as soon as the logs change.

## Layout Component Artifact

```tsx
import VelocityFlightDeck, { type ActionCapsule, type VelocityNode } from "./VelocityFlightDeck";

function loadVelocityNodes(): VelocityNode[] {
  const events = [...readJsonl(PATHS.speakerIngestLog), ...readJsonl(PATHS.autonomicHarvestLog)];
  const serialized = JSON.stringify(events).toUpperCase();

  return [
    {
      id: "sally",
      label: "SALLY_REPAIR",
      state: serialized.includes("RECEIPT_INBOX") ? "RECEIPT_INTAKE" : "IDLE",
      token_saturation: serialized.includes("RECEIPT_INBOX") ? 46 : 12,
      active: serialized.includes("RECEIPT_INBOX_NEW_FILE")
    },
    {
      id: "ender",
      label: "ENDER@BETSY",
      state: "COMPRESSED_THOUGHT_STREAM",
      token_saturation: serialized.includes("DOCTRINE") || serialized.includes("HARVEST") ? 74 : 28,
      active: serialized.includes("ACTIVE_DOCTRINE_NEW_MARKDOWN") || serialized.includes("TRANSACTION_CAPSULE_HARVESTED")
    },
    {
      id: "thufir",
      label: "THUFIR@BETSY",
      state: serialized.includes("REBUILD_INDEX") ? "VALIDATING_INDEX" : "INDEX_STANDING_BY",
      token_saturation: serialized.includes("REBUILD_INDEX") ? 68 : 22,
      active: serialized.includes("ACTIVE_DOCTRINE_REBUILD_INDEX")
    }
  ];
}

function loadInitialActionCapsules(): ActionCapsule[] {
  const eventCapsules = [...readJsonl(PATHS.speakerIngestLog), ...readJsonl(PATHS.autonomicHarvestLog)]
    .map(capsuleFromEvent)
    .filter((capsule): capsule is ActionCapsule => Boolean(capsule));
  const stagedFiles = [PATHS.stagedDoctrine, PATHS.stagedReceipts, PATHS.rawReceiptInbox].flatMap((directory) => {
    if (!fs.existsSync(directory)) return [];
    return fs
      .readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".json")))
      .map((entry) => capsuleFromFile(path.join(directory, entry.name), directory.includes("doctrine") ? "Ender@Betsy" : "Dink@Betsy"));
  });

  return [...stagedFiles, ...eventCapsules]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 8);
}

<VelocityFlightDeck initialNodes={velocityNodes} initialCapsules={actionCapsules} />
```

## Client Conveyor + SSE Hook

```tsx
useEffect(() => {
  const events = new EventSource("/api/velocity/events");
  events.addEventListener("open", () => setStreamState("SSE_CONNECTED"));
  events.addEventListener("error", () => setStreamState("SSE_RECONNECTING"));

  function handleVelocity(raw: MessageEvent<string>) {
    const event = JSON.parse(raw.data) as VelocityEvent;
    if (event.node?.id) {
      setNodes((current) => current.map((node) => {
        if (node.id !== event.node?.id) return node;
        return {
          ...node,
          ...event.node,
          token_saturation: clampPercent(event.node.token_saturation ?? node.token_saturation),
          active: Boolean(event.node.active ?? node.active)
        };
      }));
    }
    if (event.capsule) {
      setCapsules((current) => mergeCapsule(current, normalizeCapsule(event.capsule || {})));
    }
  }

  events.addEventListener("velocity", handleVelocity);
  events.addEventListener("transaction_capsule", handleVelocity);
  events.addEventListener("watch_substrate", handleVelocity);

  return () => events.close();
}, []);
```

The rendered capsule field is:

```tsx
<p className="font-mono text-sm font-black text-amber-100">
  [ AWAITING_MOMENTUM_TAP: {capsule.awaiting} ]
</p>
```

## SSE Route Artifact

```ts
export async function GET() {
  let interval: ReturnType<typeof setInterval> | null = null;
  const watchers: fs.FSWatcher[] = [];
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const seen = new Set<string>();

      function pump() {
        for (const event of [...readLastJsonl(INGEST_LOG_PATH), ...readLastJsonl(HARVEST_LOG_PATH)]) {
          const key = JSON.stringify(event);
          if (seen.has(key)) continue;
          seen.add(key);
          send(controller, "velocity", velocityPayload(event));
        }
      }

      send(controller, "velocity", {
        type: "velocity_ready",
        node: { id: "sally", label: "SALLY_REPAIR", state: "IDLE", token_saturation: 12, active: false },
        capsule: null
      });

      pump();
      for (const logPath of [INGEST_LOG_PATH, HARVEST_LOG_PATH]) {
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, "", "utf8");
        watchers.push(fs.watch(logPath, { persistent: false }, pump));
      }
      interval = setInterval(pump, 1000);
    },
    cancel() {
      if (interval) clearInterval(interval);
      for (const watcher of watchers) watcher.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
```

## Verification

```text
npx tsc --noEmit --pretty false
exit_code=0

ReadLints
No linter errors found.

npm run dev
next dev -p 3339
Local: http://localhost:3339
Ready

page_status=200
has_velocity_header=True
has_conveyor=True

curl --max-time 4 -s -N http://127.0.0.1:3339/api/velocity/events
sse_has_velocity=True
sse_has_capsule=True
sse_has_target_mutations=True
```

The bounded `curl` probe exits with timeout code `28` because SSE streams intentionally remain open; the captured body contained `event: velocity`, `AWAITING_MOMENTUM_TAP`, and `target_mutations`.

## Files

- `tinkarden/membrane/app/page.tsx`
- `tinkarden/membrane/app/VelocityFlightDeck.tsx`
- `tinkarden/membrane/app/api/velocity/events/route.ts`
- `tinkarden/membrane/app/globals.css`
- `tinkarden/membrane/package.json`
