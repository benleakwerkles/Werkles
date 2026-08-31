import "server-only";

import {
  buildOperatorTechStackDiagnosticSnapshot,
  type OperatorTechStackDiagnosticSnapshot
} from "./operator-tech-stack-diagnostics";

/** Server/operator-only entrypoint. Do not expose this DTO from a public route. */
export function getOperatorTechStackDiagnostics(): OperatorTechStackDiagnosticSnapshot {
  return buildOperatorTechStackDiagnosticSnapshot();
}
