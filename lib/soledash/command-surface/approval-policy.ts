import fs from "node:fs";
import path from "node:path";

export type ApprovalPolicyClass = "GREEN" | "BLUE" | "RED";

export type ApprovalPolicyCandidate = {
  id: string;
  label: string;
  patterns: string[];
  classification?: ApprovalPolicyClass;
  owner?: string;
  scope?: string;
  expiry?: string | null;
  rollback_fallback?: string;
  receipt_required?: boolean;
  receipt_path?: string;
  receipt_fields?: string[];
  human_gate_required?: boolean;
  source_model?: string;
  source_policy_id?: number;
  source_policy_name?: string;
};

export type ApprovalPolicyClassConfig = {
  description: string;
  approved_by_operator: boolean;
  approved_at?: string;
  execution: "auto_execute" | "auto_execute_and_receipt" | "require_approval_every_time";
  receipt_required: boolean;
  surface_to_ben: boolean;
  candidates: ApprovalPolicyCandidate[];
};

export type ApprovalPolicyRegistry = {
  version: "v1";
  name: "AUTOMATICA_APPROVALS";
  updated_at: string;
  goal: string;
  inventory_path?: string;
  source_model?: string;
  policy_model_v1?: {
    approved_now: number[];
    do_not_encode: number[];
    hold_for_revision: number[];
    note: string;
  };
  policy: {
    default_class: ApprovalPolicyClass;
    precedence: ApprovalPolicyClass[];
    lookup_mode: string;
    no_background_crawler: boolean;
  };
  classes: Record<ApprovalPolicyClass, ApprovalPolicyClassConfig>;
};

export type ApprovalPolicyMatch = {
  approvalClass: ApprovalPolicyClass;
  candidateId: string;
  candidateLabel: string;
  pattern: string;
  execution: ApprovalPolicyClassConfig["execution"];
  receiptRequired: boolean;
  surfaceToBen: boolean;
  approvedByOperator: boolean;
  sourcePath: string;
};

const ROOT = process.cwd();
export const APPROVALS_REGISTRY_PATH = "foreman/soledash/AUTOMATICA_APPROVALS.json";
const ABS_REGISTRY_PATH = path.join(ROOT, APPROVALS_REGISTRY_PATH);

const CLASS_PRECEDENCE: ApprovalPolicyClass[] = ["RED", "BLUE", "GREEN"];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function patternMatches(text: string, pattern: string): boolean {
  const needle = normalize(pattern);
  if (!needle) return false;
  return normalize(text).includes(needle);
}

export function readApprovalPolicyRegistry(): ApprovalPolicyRegistry | null {
  try {
    const text = fs.readFileSync(ABS_REGISTRY_PATH, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(text) as ApprovalPolicyRegistry;
  } catch {
    return null;
  }
}

export function lookupApprovalPolicy(actionText: string): ApprovalPolicyMatch | null {
  const registry = readApprovalPolicyRegistry();
  if (!registry) return null;

  for (const className of CLASS_PRECEDENCE) {
    const config = registry.classes[className];
    for (const candidate of config.candidates) {
      for (const pattern of candidate.patterns) {
        if (!patternMatches(actionText, pattern)) continue;
        return {
          approvalClass: className,
          candidateId: candidate.id,
          candidateLabel: candidate.label,
          pattern,
          execution: config.execution,
          receiptRequired: candidate.receipt_required ?? config.receipt_required,
          surfaceToBen: config.surface_to_ben,
          approvedByOperator: config.approved_by_operator,
          sourcePath: APPROVALS_REGISTRY_PATH
        };
      }
    }
  }

  return null;
}
