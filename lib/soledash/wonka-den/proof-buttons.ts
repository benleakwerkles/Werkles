import type { WonkaActionId } from "@/lib/soledash/wonka-den/action-catalog";

export type WonkaProofButton = {
  id: WonkaActionId;
  label: string;
  /** Intent string matched by Shakespeare v0 SWAT rules before execution. */
  shakespeareIntent: string;
};

export const WONKA_PROOF_BUTTONS: WonkaProofButton[] = [
  {
    id: "PROVE_HOSTNAME",
    label: "Prove Den Is Alive",
    shakespeareIntent: "localhost check hostname"
  },
  {
    id: "PROVE_WHOAMI",
    label: "Who Am I",
    shakespeareIntent: "local read whoami identity"
  },
  {
    id: "PROVE_GIT_STATUS",
    label: "Git Status",
    shakespeareIntent: "local read git status"
  },
  {
    id: "PROVE_NODE_VERSION",
    label: "Node Version",
    shakespeareIntent: "local read node version"
  },
  {
    id: "PROVE_NPM_VERSION",
    label: "NPM Version",
    shakespeareIntent: "local read npm version"
  },
  {
    id: "PROVE_DIR_FOREMAN",
    label: "List Foreman",
    shakespeareIntent: "file search foreman directory"
  }
];

export function proofButtonFor(actionId: string): WonkaProofButton | undefined {
  return WONKA_PROOF_BUTTONS.find((button) => button.id === actionId);
}
