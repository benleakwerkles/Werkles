import "server-only";

import fs from "node:fs";
import path from "node:path";

import type {
  ReceiptChainLookupResult,
  ReceiptDependencyLookupResult,
  ReceiptGraph,
  ReceiptGraphEdge,
  ReceiptGraphLookupResult,
  ReceiptGraphNode,
  ReceiptGraphOrigin,
  ReceiptGraphRelation,
  ReceiptGraphSource,
  ReceiptOriginNode
} from "./types";

const ROOT = process.cwd();
const SOLEDASH_DIR = path.join(ROOT, "foreman", "soledash");

type RawReceiptRecord = {
  source: ReceiptGraphSource;
  filePath: string;
  relPath: string;
  raw: Record<string, unknown>;
};

type MutableGraph = {
  nodesById: Map<string, ReceiptGraphNode>;
  originNodesById: Map<string, ReceiptOriginNode>;
  edgesById: Map<string, ReceiptGraphEdge>;
  aliases: Map<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(stringValue).filter((item): item is string => Boolean(item));
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const str = stringValue(value);
    if (str) return str;
  }
  return null;
}

function key(value: string): string {
  return value.trim().toLowerCase();
}

function rel(filePath: string): string {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function basenameId(filePath: string): string {
  return path.basename(filePath).replace(/\.(json|jsonl)$/i, "");
}

function readJson(filePath: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function readJsonl(filePath: string): Record<string, unknown>[] {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown)
      .filter(isRecord);
  } catch {
    return [];
  }
}

function walkDirs(base: string): string[] {
  const dirs: string[] = [];
  const stack = [base];

  while (stack.length) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    if (path.basename(dir).toLowerCase() === "receipts") {
      dirs.push(dir);
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        stack.push(path.join(dir, entry.name));
      }
    }
  }

  return dirs;
}

function walkJsonFiles(base: string): string[] {
  const files: string[] = [];
  const stack = [base];

  while (stack.length) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(filePath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        files.push(filePath);
      }
    }
  }

  return files.sort();
}

function sourceForPath(relPath: string): ReceiptGraphSource {
  if (relPath.includes("/ACTION_RECEIPTS.jsonl")) return "action_receipt";
  if (relPath.includes("/approval-swatter-alpha/receipts/")) return "approval_swatter";
  if (relPath.includes("/automatica/receipts/")) return "automatica_relay";
  if (relPath.includes("/focus-theft/receipts/")) return "focus_theft";
  if (relPath.includes("/intent-memory/receipts/")) return "intent_memory";
  if (relPath.includes("/intent-router/receipts/")) return "intent_router";
  if (relPath.includes("/permission-fly/receipts/")) return "permission_fly";
  if (relPath.includes("/wisdom-watch/receipts/")) return "wisdom_watch";
  if (relPath.includes("/receipts/") || relPath.includes("PETRA_TRANSPORT_RECEIPTS.jsonl")) {
    return "soledash_transport";
  }
  return "unknown";
}

function loadRawReceipts(): RawReceiptRecord[] {
  const records: RawReceiptRecord[] = [];
  const receiptDirs = fs.existsSync(SOLEDASH_DIR) ? walkDirs(SOLEDASH_DIR) : [];

  for (const dir of receiptDirs) {
    for (const filePath of walkJsonFiles(dir)) {
      const raw = readJson(filePath);
      if (!isRecord(raw)) continue;
      const relPath = rel(filePath);
      records.push({
        source: sourceForPath(relPath),
        filePath,
        relPath,
        raw
      });
    }
  }

  const jsonlFiles = [
    path.join(SOLEDASH_DIR, "ACTION_RECEIPTS.jsonl"),
    path.join(SOLEDASH_DIR, "PETRA_TRANSPORT_RECEIPTS.jsonl")
  ];

  for (const filePath of jsonlFiles) {
    if (!fs.existsSync(filePath)) continue;
    const relPath = rel(filePath);
    const source = sourceForPath(relPath);
    for (const raw of readJsonl(filePath)) {
      records.push({ source, filePath, relPath, raw });
    }
  }

  return records;
}

function collectAliases(raw: Record<string, unknown>, relPath: string, primaryId: string): string[] {
  const aliases = new Set<string>([primaryId]);
  if (!relPath.toLowerCase().endsWith(".jsonl")) {
    aliases.add(relPath);
    aliases.add(basenameId(relPath));
  }
  for (const value of [
    raw.id,
    raw.receipt_id,
    raw.receiptId,
    raw.action_id,
    raw.actionId,
    raw.packet_id,
    raw.packetId,
    raw.prompt_id,
    raw.promptId,
    raw.fly_id,
    raw.flyId,
    raw.receipt_link,
    raw.receipt_path,
    raw.receiptPath
  ]) {
    const str = stringValue(value);
    if (str) aliases.add(str);
  }
  return [...aliases];
}

function originFrom(raw: Record<string, unknown>): ReceiptGraphOrigin {
  return {
    cardId: firstString(raw.card_id, raw.cardId),
    policyId: firstString(raw.policy_id, raw.policyId, raw.approvalPolicyId, raw.candidate_id),
    dispatchId: firstString(
      raw.dispatch_id,
      raw.dispatchId,
      raw.writtenTo,
      raw.written_to,
      raw.outbound_path,
      raw.outboundPath,
      raw.outboxPath,
      raw.packetPath,
      raw.packet_path
    ),
    packetId: firstString(raw.packet_id, raw.packetId),
    actionId: firstString(raw.action_id, raw.actionId, raw.prompt_id, raw.promptId),
    buildId: firstString(raw.buildId, raw.build_id)
  };
}

function parentFrom(raw: Record<string, unknown>): string | null {
  return firstString(
    raw.parent_receipt,
    raw.parent_receipt_id,
    raw.parentReceipt,
    raw.parentReceiptId,
    raw.parent_id
  );
}

function childrenFrom(raw: Record<string, unknown>): string[] {
  return [
    ...stringArray(raw.child_receipts),
    ...stringArray(raw.childReceiptIds),
    ...stringArray(raw.children)
  ];
}

function followUpsFrom(raw: Record<string, unknown>): string[] {
  return [
    ...stringArray(raw.follow_up_receipts),
    ...stringArray(raw.followUpReceiptIds),
    ...stringArray(raw.followUps),
    ...stringArray(raw.next_receipts),
    ...stringArray(raw.nextReceiptIds)
  ];
}

function normalizeRecord(record: RawReceiptRecord): ReceiptGraphNode {
  const raw = record.raw;
  const primaryId =
    firstString(raw.receipt_id, raw.receiptId, raw.id, raw.packet_id, raw.action_id, raw.prompt_id, raw.fly_id) ??
    basenameId(record.relPath);

  const status = firstString(raw.status, raw.state, raw.outcome, raw.action);
  const timestamp = firstString(
    raw.timestamp,
    raw.updated_at,
    raw.updatedAt,
    raw.created_at,
    raw.createdAt,
    raw.last_update,
    raw.decided_at,
    raw.at
  );
  const title =
    firstString(raw.buildTitle, raw.card_name, raw.policy_label, raw.target, raw.summary, raw.source, raw.action) ??
    primaryId;

  return {
    id: primaryId,
    source: record.source,
    title,
    status,
    timestamp,
    paths: [record.relPath],
    aliases: collectAliases(raw, record.relPath, primaryId),
    parentReceiptId: parentFrom(raw),
    childReceiptIds: childrenFrom(raw),
    followUpReceiptIds: followUpsFrom(raw),
    originating: originFrom(raw),
    raw
  };
}

function mergeOrigin(a: ReceiptGraphOrigin, b: ReceiptGraphOrigin): ReceiptGraphOrigin {
  return {
    cardId: a.cardId ?? b.cardId,
    policyId: a.policyId ?? b.policyId,
    dispatchId: a.dispatchId ?? b.dispatchId,
    packetId: a.packetId ?? b.packetId,
    actionId: a.actionId ?? b.actionId,
    buildId: a.buildId ?? b.buildId
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function upsertNode(graph: MutableGraph, node: ReceiptGraphNode): void {
  const existingId = graph.aliases.get(key(node.id)) ?? node.id;
  const existing = graph.nodesById.get(existingId);

  if (!existing) {
    graph.nodesById.set(node.id, {
      ...node,
      paths: unique(node.paths),
      aliases: unique(node.aliases),
      childReceiptIds: unique(node.childReceiptIds),
      followUpReceiptIds: unique(node.followUpReceiptIds)
    });
    for (const alias of node.aliases) {
      graph.aliases.set(key(alias), node.id);
    }
    return;
  }

  existing.paths = unique([...existing.paths, ...node.paths]);
  existing.aliases = unique([...existing.aliases, ...node.aliases]);
  existing.childReceiptIds = unique([...existing.childReceiptIds, ...node.childReceiptIds]);
  existing.followUpReceiptIds = unique([...existing.followUpReceiptIds, ...node.followUpReceiptIds]);
  existing.parentReceiptId = existing.parentReceiptId ?? node.parentReceiptId;
  existing.originating = mergeOrigin(existing.originating, node.originating);
  existing.status = existing.status ?? node.status;
  existing.timestamp = existing.timestamp ?? node.timestamp;
  existing.raw = { ...node.raw, ...existing.raw };

  for (const alias of existing.aliases) {
    graph.aliases.set(key(alias), existing.id);
  }
}

function edgeId(from: string, to: string, relation: ReceiptGraphRelation): string {
  return `${relation}:${from}->${to}`;
}

function addEdge(graph: MutableGraph, from: string, to: string, relation: ReceiptGraphRelation, label: string): void {
  if (!from || !to || from === to) return;
  const id = edgeId(from, to, relation);
  if (!graph.edgesById.has(id)) {
    graph.edgesById.set(id, { id, from, to, relation, label });
  }
}

function addOriginNode(graph: MutableGraph, kind: ReceiptOriginNode["kind"], rawId: string | null): string | null {
  if (!rawId) return null;
  const id = `${kind}:${rawId}`;
  if (!graph.originNodesById.has(id)) {
    graph.originNodesById.set(id, { id, kind, label: rawId });
  }
  return id;
}

function resolveAlias(graph: MutableGraph | ReceiptGraph, receiptId: string | null): string | null {
  if (!receiptId) return null;
  const aliasMap = graph instanceof Object && "aliases" in graph && graph.aliases instanceof Map
    ? graph.aliases
    : new Map(Object.entries((graph as ReceiptGraph).aliases).map(([alias, id]) => [key(alias), id]));
  return aliasMap.get(key(receiptId)) ?? null;
}

function dateValue(node: ReceiptGraphNode): number {
  const ts = node.timestamp ? new Date(node.timestamp).getTime() : Number.NaN;
  return Number.isFinite(ts) ? ts : 0;
}

function addGroupFollowUps(graph: MutableGraph, getGroupId: (node: ReceiptGraphNode) => string | null): void {
  const groups = new Map<string, ReceiptGraphNode[]>();
  for (const node of graph.nodesById.values()) {
    const groupId = getGroupId(node);
    if (!groupId) continue;
    const bucket = groups.get(groupId) ?? [];
    bucket.push(node);
    groups.set(groupId, bucket);
  }

  for (const [groupId, nodes] of groups) {
    if (nodes.length < 2) continue;
    const sorted = [...nodes].sort((a, b) => dateValue(a) - dateValue(b) || a.id.localeCompare(b.id));
    for (let i = 1; i < sorted.length; i += 1) {
      addEdge(graph, sorted[i - 1]!.id, sorted[i]!.id, "follow_up", `follow-up in ${groupId}`);
    }
  }
}

function finalizeRelationships(graph: MutableGraph): void {
  for (const node of graph.nodesById.values()) {
    const parentId = resolveAlias(graph, node.parentReceiptId);
    if (parentId) addEdge(graph, parentId, node.id, "parent_child", "parent receipt");

    for (const child of node.childReceiptIds) {
      const childId = resolveAlias(graph, child);
      if (childId) addEdge(graph, node.id, childId, "parent_child", "child receipt");
    }

    for (const followUp of node.followUpReceiptIds) {
      const followUpId = resolveAlias(graph, followUp);
      if (followUpId) addEdge(graph, node.id, followUpId, "follow_up", "explicit follow-up");
    }

    const cardNode = addOriginNode(graph, "card", node.originating.cardId);
    if (cardNode) addEdge(graph, cardNode, node.id, "originating_card", "originating card");

    const policyNode = addOriginNode(graph, "policy", node.originating.policyId);
    if (policyNode) addEdge(graph, policyNode, node.id, "originating_policy", "originating policy");

    const dispatchNode = addOriginNode(graph, "dispatch", node.originating.dispatchId);
    if (dispatchNode) addEdge(graph, dispatchNode, node.id, "originating_dispatch", "originating dispatch");
  }

  addGroupFollowUps(graph, (node) => node.originating.buildId ? `build:${node.originating.buildId}` : null);
  addGroupFollowUps(graph, (node) => node.originating.cardId ? `card:${node.originating.cardId}` : null);
  addGroupFollowUps(graph, (node) => node.originating.dispatchId ? `dispatch:${node.originating.dispatchId}` : null);

  for (const edge of graph.edgesById.values()) {
    const from = graph.nodesById.get(edge.from);
    const to = graph.nodesById.get(edge.to);
    if (!from || !to) continue;

    if (edge.relation === "parent_child") {
      from.childReceiptIds = unique([...from.childReceiptIds, to.id]);
      to.parentReceiptId = to.parentReceiptId ?? from.id;
    } else if (edge.relation === "follow_up") {
      from.followUpReceiptIds = unique([...from.followUpReceiptIds, to.id]);
    }
  }
}

export function loadReceiptGraph(): ReceiptGraph {
  const graph: MutableGraph = {
    nodesById: new Map(),
    originNodesById: new Map(),
    edgesById: new Map(),
    aliases: new Map()
  };

  for (const record of loadRawReceipts()) {
    upsertNode(graph, normalizeRecord(record));
  }

  finalizeRelationships(graph);

  return {
    generatedAt: new Date().toISOString(),
    nodes: [...graph.nodesById.values()].sort((a, b) => b.id.localeCompare(a.id)),
    originNodes: [...graph.originNodesById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...graph.edgesById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    aliases: Object.fromEntries([...graph.aliases.entries()].sort((a, b) => a[0].localeCompare(b[0])))
  };
}

function graphMaps(graph: ReceiptGraph) {
  return {
    nodesById: new Map(graph.nodes.map((node) => [node.id, node])),
    originsById: new Map(graph.originNodes.map((node) => [node.id, node]))
  };
}

function componentFor(graph: ReceiptGraph, startId: string, includeOrigins: boolean): {
  nodeIds: Set<string>;
  originIds: Set<string>;
  edgeIds: Set<string>;
} {
  const nodeIds = new Set<string>();
  const originIds = new Set<string>();
  const edgeIds = new Set<string>();
  const queue = [startId];

  while (queue.length) {
    const current = queue.shift()!;
    if (nodeIds.has(current) || originIds.has(current)) continue;
    if (current.includes(":") && !graph.nodes.some((node) => node.id === current)) {
      originIds.add(current);
    } else {
      nodeIds.add(current);
    }

    for (const edge of graph.edges) {
      if (!includeOrigins && (edge.from.includes(":") || edge.to.includes(":"))) continue;
      const touches = edge.from === current || edge.to === current;
      if (!touches) continue;
      edgeIds.add(edge.id);
      const other = edge.from === current ? edge.to : edge.from;
      if (!nodeIds.has(other) && !originIds.has(other)) queue.push(other);
    }
  }

  return { nodeIds, originIds, edgeIds };
}

function aliasesFor(graph: ReceiptGraph, nodeIds: Set<string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(graph.aliases).filter(([, id]) => nodeIds.has(id))
  );
}

export function lookupReceiptGraph(receiptId: string): ReceiptGraphLookupResult {
  const graph = loadReceiptGraph();
  const resolvedId = resolveAlias(graph, receiptId);
  if (!resolvedId) {
    return { ok: false, receiptId, resolvedId: null, node: null, graph: null, blocker: "receipt id not found" };
  }

  const maps = graphMaps(graph);
  const node = maps.nodesById.get(resolvedId) ?? null;
  if (!node) {
    return { ok: false, receiptId, resolvedId, node: null, graph: null, blocker: "resolved id missing node" };
  }

  const component = componentFor(graph, resolvedId, true);
  return {
    ok: true,
    receiptId,
    resolvedId,
    node,
    graph: {
      generatedAt: graph.generatedAt,
      nodes: graph.nodes.filter((item) => component.nodeIds.has(item.id)),
      originNodes: graph.originNodes.filter((item) => component.originIds.has(item.id)),
      edges: graph.edges.filter((item) => component.edgeIds.has(item.id)),
      aliases: aliasesFor(graph, component.nodeIds)
    },
    blocker: null
  };
}

export function lookupReceiptChain(receiptId: string): ReceiptChainLookupResult {
  const graph = loadReceiptGraph();
  const resolvedId = resolveAlias(graph, receiptId);
  if (!resolvedId) {
    return { ok: false, receiptId, resolvedId: null, chain: [], edges: [], blocker: "receipt id not found" };
  }

  const component = componentFor(graph, resolvedId, false);
  const chain = graph.nodes
    .filter((node) => component.nodeIds.has(node.id))
    .sort((a, b) => dateValue(a) - dateValue(b) || a.id.localeCompare(b.id));

  return {
    ok: true,
    receiptId,
    resolvedId,
    chain,
    edges: graph.edges.filter((edge) => component.edgeIds.has(edge.id)),
    blocker: null
  };
}

export function lookupReceiptDependencies(receiptId: string): ReceiptDependencyLookupResult {
  const graph = loadReceiptGraph();
  const resolvedId = resolveAlias(graph, receiptId);
  if (!resolvedId) {
    return {
      ok: false,
      receiptId,
      resolvedId: null,
      node: null,
      parentReceipt: null,
      childReceipts: [],
      followUpReceipts: [],
      originatingCard: null,
      originatingPolicy: null,
      originatingDispatch: null,
      blocker: "receipt id not found"
    };
  }

  const maps = graphMaps(graph);
  const node = maps.nodesById.get(resolvedId) ?? null;
  if (!node) {
    return {
      ok: false,
      receiptId,
      resolvedId,
      node: null,
      parentReceipt: null,
      childReceipts: [],
      followUpReceipts: [],
      originatingCard: null,
      originatingPolicy: null,
      originatingDispatch: null,
      blocker: "resolved id missing node"
    };
  }

  const origin = node.originating;
  const parentId = resolveAlias(graph, node.parentReceiptId);

  return {
    ok: true,
    receiptId,
    resolvedId,
    node,
    parentReceipt: parentId ? maps.nodesById.get(parentId) ?? null : null,
    childReceipts: node.childReceiptIds
      .map((id) => resolveAlias(graph, id))
      .filter((id): id is string => Boolean(id))
      .map((id) => maps.nodesById.get(id))
      .filter((item): item is ReceiptGraphNode => Boolean(item)),
    followUpReceipts: node.followUpReceiptIds
      .map((id) => resolveAlias(graph, id))
      .filter((id): id is string => Boolean(id))
      .map((id) => maps.nodesById.get(id))
      .filter((item): item is ReceiptGraphNode => Boolean(item)),
    originatingCard: origin.cardId ? maps.originsById.get(`card:${origin.cardId}`) ?? null : null,
    originatingPolicy: origin.policyId ? maps.originsById.get(`policy:${origin.policyId}`) ?? null : null,
    originatingDispatch: origin.dispatchId ? maps.originsById.get(`dispatch:${origin.dispatchId}`) ?? null : null,
    blocker: null
  };
}
