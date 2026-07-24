import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: root });
const candidateFiles = [
  "app/dashboard/profile/page.tsx",
  "components/squibb/evidence-section.tsx",
  "components/squibb/personal-recommendation-delivery.tsx",
  "components/squibb/recommendation-card.tsx",
  "components/squibb/recommendation-surface.tsx",
  "scripts/foreman/fixtures/vpg32-invalid-hook.tsx"
];

export default [
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "dist/**"]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript").map((config) => ({
    ...config,
    files: candidateFiles
  }))
];
