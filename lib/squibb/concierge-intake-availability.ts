/**
 * Public Bellows intake boundary.
 *
 * - Local / non-production: open by default (Operator can submit on Betsy localhost).
 * - Production builds: closed unless explicitly opened via env.
 * - Explicit env always wins: BELLOWS_INTAKE_SUBMISSION_OPEN or NEXT_PUBLIC_BELLOWS_INTAKE_SUBMISSION_OPEN
 *   (`true` / `false`).
 *
 * Opening production requires Operator phrase + Vercel env + deploy.
 * Gate: foreman/reviews/GATE-open-bellows-intake-submission-20260720.md
 */

function readExplicitFlag(): boolean | null {
  const raw =
    process.env.NEXT_PUBLIC_BELLOWS_INTAKE_SUBMISSION_OPEN?.trim() ||
    process.env.BELLOWS_INTAKE_SUBMISSION_OPEN?.trim();
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return null;
}

const explicit = readExplicitFlag();

export const BELLOWS_INTAKE_SUBMISSION_OPEN =
  explicit !== null ? explicit : process.env.NODE_ENV !== "production";

export const BELLOWS_INTAKE_CLOSED_MESSAGE =
  "Intake submission is temporarily closed while secure account storage is being connected.";
