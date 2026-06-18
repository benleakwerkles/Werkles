export const AEYE_OPTIONS = [
  { id: "DINK_BETSY", label: "Dink @ Betsy" },
  { id: "BEAN_SALLY", label: "Bean @ Sally" },
  { id: "PETRA", label: "Petra" },
  { id: "MAKER", label: "Maker" },
  { id: "ENDER", label: "Ender" },
  { id: "SKYBRO", label: "Skybro" },
  { id: "THUFIR", label: "Thufir" },
  { id: "DOSS", label: "Doss" },
  { id: "SPANZEE", label: "Spanzee" }
] as const;

export type AeyeId = (typeof AEYE_OPTIONS)[number]["id"];

export const WONKA_ACTIONS = [
  {
    id: "PROVE_HOSTNAME",
    label: "Hostname proof",
    category: "Machine",
    defaultAeye: "DINK_BETSY",
    executableLabel: "cmd.exe /c hostname",
    summary: "Return the Betsy hostname."
  },
  {
    id: "PROVE_WHOAMI",
    label: "Operator identity",
    category: "Machine",
    defaultAeye: "DINK_BETSY",
    executableLabel: "whoami.exe",
    summary: "Return the local Windows user."
  },
  {
    id: "PROVE_NODE_PROCESSES",
    label: "Node process inventory",
    category: "Machine",
    defaultAeye: "DINK_BETSY",
    executableLabel: "tasklist.exe /FI \"IMAGENAME eq node.exe\"",
    summary: "Show local node.exe process rows."
  },
  {
    id: "PROVE_REPO_ROOT",
    label: "Repo working path",
    category: "Repo",
    defaultAeye: "DINK_BETSY",
    executableLabel: "cmd.exe /c cd",
    summary: "Return the current Werkles repo path."
  },
  {
    id: "PROVE_GIT_STATUS",
    label: "Git status",
    category: "Repo",
    defaultAeye: "DINK_BETSY",
    executableLabel: "git status --short",
    summary: "Show changed files without mutating git."
  },
  {
    id: "PROVE_GIT_BRANCH",
    label: "Git branch",
    category: "Repo",
    defaultAeye: "DINK_BETSY",
    executableLabel: "git branch --show-current",
    summary: "Show the current branch."
  },
  {
    id: "PROVE_GIT_DIFF_STAT",
    label: "Diff stat",
    category: "Repo",
    defaultAeye: "DINK_BETSY",
    executableLabel: "git diff --stat",
    summary: "Summarize local file changes."
  },
  {
    id: "PROVE_NODE_VERSION",
    label: "Node version",
    category: "Runtime",
    defaultAeye: "DINK_BETSY",
    executableLabel: "node -v",
    summary: "Show the Node runtime version."
  },
  {
    id: "PROVE_NPM_VERSION",
    label: "NPM version",
    category: "Runtime",
    defaultAeye: "DINK_BETSY",
    executableLabel: "npm -v",
    summary: "Show the npm version."
  },
  {
    id: "PROVE_DIR_FOREMAN",
    label: "Foreman folder",
    category: "Receipts",
    defaultAeye: "PETRA",
    executableLabel: "cmd.exe /c dir foreman",
    summary: "List Foreman top-level files."
  },
  {
    id: "PROVE_DIR_SOLEDASH",
    label: "SoleDash receipts",
    category: "Receipts",
    defaultAeye: "PETRA",
    executableLabel: "cmd.exe /c dir foreman\\soledash",
    summary: "List SoleDash receipt files."
  },
  {
    id: "PROVE_WONKA_RECEIPTS",
    label: "Wonka receipts",
    category: "Receipts",
    defaultAeye: "PETRA",
    executableLabel: "cmd.exe /c dir foreman\\soledash\\wonka-den\\receipts",
    summary: "List Wonka Den receipt logs."
  },
  {
    id: "PROVE_RECEIPT_GRAPH_RECEIPT",
    label: "Receipt graph proof",
    category: "Receipts",
    defaultAeye: "PETRA",
    executableLabel: "cmd.exe /c dir foreman\\soledash\\RECEIPT_GRAPH_ENGINE_RECEIPT.md",
    summary: "Confirm receipt graph receipt exists."
  },
  {
    id: "PROVE_APPROVAL_REGISTRY",
    label: "Approval registry",
    category: "Automatica",
    defaultAeye: "BEAN_SALLY",
    executableLabel: "cmd.exe /c dir foreman\\soledash\\AUTOMATICA_APPROVALS.json",
    summary: "Confirm Automatica approval registry exists."
  },
  {
    id: "PROVE_APPROVAL_SWATTER",
    label: "Approval swatter script",
    category: "Automatica",
    defaultAeye: "BEAN_SALLY",
    executableLabel: "cmd.exe /c dir scripts\\foreman\\background-approval-swatter-alpha.mjs",
    summary: "Confirm the background swatter script exists."
  },
  {
    id: "PROVE_SHAKESPEARE",
    label: "Shakespeare policy path",
    category: "Automatica",
    defaultAeye: "BEAN_SALLY",
    executableLabel: "cmd.exe /c dir scripts\\foreman\\shakespeare-v0.mjs",
    summary: "Confirm the no-LLM policy path exists."
  },
  {
    id: "PROVE_HANDOFF_OUTBOX",
    label: "Handoff outbox",
    category: "Dispatch",
    defaultAeye: "DINK_BETSY",
    executableLabel: "cmd.exe /c dir foreman\\handoffs\\outbox",
    summary: "List outgoing Aeye handoff packets."
  },
  {
    id: "PROVE_SCRIPTS_FOREMAN",
    label: "Foreman scripts",
    category: "Dispatch",
    defaultAeye: "MAKER",
    executableLabel: "cmd.exe /c dir scripts\\foreman",
    summary: "List local Foreman scripts."
  },
  {
    id: "PROVE_PACKAGE_JSON",
    label: "Package manifest",
    category: "Runtime",
    defaultAeye: "DINK_BETSY",
    executableLabel: "cmd.exe /c dir package.json",
    summary: "Confirm package.json is present."
  },
  {
    id: "PROVE_NEXT_CONFIG",
    label: "Next config",
    category: "Runtime",
    defaultAeye: "MAKER",
    executableLabel: "cmd.exe /c dir next.config.*",
    summary: "Show local Next config files."
  }
] as const;

export type WonkaActionId = (typeof WONKA_ACTIONS)[number]["id"];

export function wonkaActionFor(actionId: string) {
  return WONKA_ACTIONS.find((action) => action.id === actionId) ?? null;
}

export function aeyeFor(aeyeId: string) {
  return AEYE_OPTIONS.find((aeye) => aeye.id === aeyeId) ?? null;
}
